type EditBayBackdropProps = {
  className?: string;
};

/** NLE workspace background: vignette, frame ruler, timeline floor. */
export function EditBayBackdrop({ className = "" }: EditBayBackdropProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <div className="edit-bay-vignette absolute inset-0" />
      <div className="frame-ruler absolute inset-x-0 top-[45%] hidden h-6 opacity-50 lg:block" />
      <div className="timeline-floor absolute inset-x-0 bottom-0 h-28" />
      <div className="film-grain absolute inset-0" />
    </div>
  );
}
