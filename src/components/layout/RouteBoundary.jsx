import { Component } from 'react'
import { RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { logDev } from '@/lib/errors'

export class RouteBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    logDev('route', error?.stack ?? error?.message ?? error)
  }

  componentDidUpdate(prev) {
    if (this.state.failed && prev.routeKey !== this.props.routeKey) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="surface-card flex min-h-[420px] flex-col items-center justify-center rounded-card px-6 text-center">
        <p className="text-headline-md text-ink">This page didn&apos;t load</p>
        <p className="mt-2 max-w-sm text-body-md leading-relaxed text-muted">
          Something went wrong on the way here. Reloading usually sorts it.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="mt-6"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={14} strokeWidth={2.2} />
          Reload
        </Button>
      </div>
    )
  }
}

export default RouteBoundary
