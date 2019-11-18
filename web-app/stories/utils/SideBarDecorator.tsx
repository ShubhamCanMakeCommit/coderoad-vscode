import * as React from 'react'

const styles = {
	container: {
		left: '25rem',
		position: 'absolute' as 'absolute',
		boxSizing: 'border-box' as 'border-box',
		borderLeft: '2px solid black',
		borderRight: '2px solid black',
		width: '50rem',
		height: window.innerHeight,
	},
}

const SideBarDecorator = storyFn => <div style={styles.container}>{storyFn()}</div>

export default SideBarDecorator
