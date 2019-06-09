import * as vscode from 'vscode'
import { join } from 'path'
import { setStorage } from '../storage'
import ReactWebView from '../ReactWebView'
import { isEmptyWorkspace } from '../workspace'
import * as CR from 'typings'
// TODO: replace with actual tutorial loading later
import tutorial from '../../state/context/tutorials/basic'

const COMMANDS = {
    START: 'coderoad.start',
    NEW_OR_CONTINUE: 'coderoad.new_or_continue',
    TUTORIAL_LAUNCH: 'coderoad.tutorial_launch',
    OPEN_WEBVIEW: 'coderoad.open_webview',
    SEND_STATE: 'coderoad.send_state',
    SEND_DATA: 'coderoad.send_data',
    RECEIVE_ACTION: 'coderoad.receive_action',
    OPEN_FILE: 'coderoad.open_file',
    RUN_TEST: 'coderoad.test_run',
}

interface CreateCommandProps {
    context: vscode.ExtensionContext,
    machine: CR.StateMachine,
    storage: any,
    git: any
    position: any
}

// React panel webview
let webview: any;

export const createCommands = ({ context, machine, storage, git, position }: CreateCommandProps) => ({
    // initialize
    [COMMANDS.START]: () => {
        // set local storage workspace
        setStorage(context.workspaceState)

        // activate machine
        webview = new ReactWebView(context.extensionPath)
        console.log('webview', webview.panel.webview.postMessage)
        machine.activate()
    },
    // open React webview
    [COMMANDS.OPEN_WEBVIEW]: (column: number = vscode.ViewColumn.One) => {
        webview.createOrShow(column);
    },
    // launch with continue or new
    [COMMANDS.NEW_OR_CONTINUE]: async () => {
        // verify that the user has a tutorial & progress
        // verify git is setup with a coderoad remote
        const [tutorial, progress, hasGit, hasGitRemote] = await Promise.all([
            storage.getTutorial(),
            storage.getProgress(),
            git.gitVersion(),
            git.gitCheckRemoteExists(),
        ])
        const canContinue = !!(tutorial && progress && hasGit && hasGitRemote)
        console.log('canContinue', canContinue)
        // if a tutorial exists, 'CONTINUE'
        // otherwise start from 'NEW'
        machine.send(canContinue ? 'CONTINUE' : 'NEW')
    },
    // launch a new tutorial
    [COMMANDS.TUTORIAL_LAUNCH]: async () => {
        console.log('launch tutorial')

        await isEmptyWorkspace()

        await git.gitInitIfNotExists()

        // TODO: use actual tutorial repo
        await Promise.all([git.gitSetupRemote(tutorial.meta.repo), storage.setTutorial(tutorial), storage.resetProgress()])

        // TODO: refactor to allow client to call initialization
        const pos: CR.Position = await position.getInitial(tutorial)

        // eslint-disable-next-line
        const { steps } = tutorial.data
        const { setup } = steps[pos.stepId].actions
        await git.gitLoadCommits(setup)
    },
    // open a file
    [COMMANDS.OPEN_FILE]: async (relativeFilePath: string) => {
        console.log(`OPEN_FILE ${JSON.stringify(relativeFilePath)}`)
        try {
            const workspaceRoot = vscode.workspace.rootPath
            if (!workspaceRoot) {
                throw new Error('No workspace root path')
            }
            const absoluteFilePath = join(workspaceRoot, relativeFilePath)
            const doc = await vscode.workspace.openTextDocument(absoluteFilePath)
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.One)
        } catch (error) {
            console.log(`Failed to open file ${relativeFilePath}`, error)
        }
    },
    // send messages to webview
    [COMMANDS.SEND_STATE]: (payload: { data: any, state: any }) => {
        webview.postMessage({ type: 'SET_STATE', payload })
    },
    [COMMANDS.SEND_DATA]: (payload: { data: any }) => {
        webview.postMessage({ type: 'SET_DATA', payload })
    },
    [COMMANDS.RECEIVE_ACTION]: (action: string | CR.Action) => {
        console.log('onReceiveAction', action)
        machine.onReceive(action)
    }
})