type Props = {
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({ description, onCancel, onConfirm, title }: Props) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-dialog">
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="confirm-actions">
          <button className="primary-button" type="button" onClick={onConfirm}>
            Yes
          </button>
          <button className="ghost-button" type="button" onClick={onCancel}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}
