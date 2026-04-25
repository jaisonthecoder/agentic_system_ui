// PortfolioHealthView.tsx — TypeScript wrapper
// @ts-expect-error — JSX file, types added in next iteration
import PortfolioHealthViewJsx from './PortfolioHealthView.jsx'
import type { ComponentType } from 'react'

const PortfolioHealthView = PortfolioHealthViewJsx as ComponentType

export default PortfolioHealthView
