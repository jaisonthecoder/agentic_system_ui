// ProjectsView.tsx — TypeScript wrapper
// The Projects domain is scheduled for full TSX migration in the next iteration.
// allowJs: true in tsconfig means the .jsx file compiles without errors.

// @ts-expect-error — JSX file, types added in next iteration
import ProjectsViewJsx from './ProjectsView.jsx'
import type { ComponentType } from 'react'

const ProjectsView = ProjectsViewJsx as ComponentType

export default ProjectsView
