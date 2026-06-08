import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import PostService from '../../services/postService';
import { PostRequest, PostResponse } from '../../types';

interface Props {
    show:      boolean;
    onHide:    () => void;
    onSuccess: () => void;
    post:      PostResponse | null;
}

const PostUpdateModal: React.FC<Props> = ({ show, onHide, onSuccess, post }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [form,      setForm]      = useState<PostRequest>({ postName: '' });

    useEffect(() => {
        if (show && post) setForm({ postName: post.postName });
    }, [show, post]);

    const handleSubmit = async () => {
        if (!post) return;
        setError(null);
        if (!form.postName.trim()) {
            setError('Le nom du poste est obligatoire.');
            return;
        }
        setIsLoading(true);
        try {
            await PostService.update(post.id, form);
            onSuccess();
            onHide();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la modification.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <i className="bi bi-pencil-square text-primary me-2" />
                    Modifier le poste
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            Nom du poste <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={form.postName}
                            onChange={e => setForm({ postName: e.target.value })}
                            className="rounded-3"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="light" onClick={onHide} className="rounded-3">
                    Annuler
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="rounded-3"
                >
                    {isLoading
                        ? <Spinner size="sm" className="me-2" />
                        : <i className="bi bi-pencil me-2" />
                    }
                    Modifier
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PostUpdateModal;