const FullPageSpinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-muted border-t-primary" />

        {/* Loading Text */}
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default FullPageSpinner
