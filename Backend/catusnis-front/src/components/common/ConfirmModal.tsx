import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ConfirmModalProps {
    show:      boolean;
    title:     string;
    message:   string;
    onConfirm: () => void;
    onCancel:  () => void;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    show, title, message,
    onConfirm, onCancel, isLoading
}) => (
    <Modal show={show} onHide={onCancel} centered>
        <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
            <Button
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
            >
                Annuler
            </Button>
            <Button
                variant="danger"
                onClick={onConfirm}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="spinner-border
                                         spinner-border-sm me-2" />
                        Suppression...
                    </>
                ) : 'Confirmer'}
            </Button>
        </Modal.Footer>
    </Modal>
);

export default ConfirmModal;