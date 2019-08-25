import * as vscode from 'vscode'
import {setWorkspaceRoot} from './services/node'
import Tutorial, {TutorialModel} from './services/tutorial'
import StateMachine from './state'
import Editor from './editor'

export const tutorial: TutorialModel = new Tutorial()
// state machine that governs application logic
export const machine = new StateMachine({dispatch: vscode.commands.executeCommand, tutorial})

// vscode editor
export const editor = new Editor({
	machine,
	setWorkspaceRoot,
})

// TODO: refactor tutorial & editor relationships
// code here is a bit smelly
tutorial.setClientDispatch(editor.dispatch)

// activate run on vscode extension initialization
export const activate = editor.activate

// deactive run on vscode extension shut down
export const deactivate = editor.deactivate
