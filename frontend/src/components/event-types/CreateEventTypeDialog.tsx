import { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { slugify } from '../../lib/utils';
import type { EventType } from '../../types';

interface CreateEventTypeDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: Omit<EventType, 'id' | 'createdAt'>) => void;
    editingEventType?: EventType | null;
}

export function CreateEventTypeDialog({
    open,
    onClose,
    onSave,
    editingEventType,
}: CreateEventTypeDialogProps) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(15);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    useEffect(() => {
        if (editingEventType) {
            setTitle(editingEventType.title);
            setSlug(editingEventType.slug);
            setDescription(editingEventType.description);
            setDuration(editingEventType.duration);
            setSlugManuallyEdited(true);
        } else {
            setTitle('');
            setSlug('');
            setDescription('');
            setDuration(15);
            setSlugManuallyEdited(false);
        }
    }, [editingEventType, open]);

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!slugManuallyEdited) {
            setSlug(slugify(value));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title,
            slug,
            description,
            duration,
            isActive: editingEventType?.isActive ?? true,
        });
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={editingEventType ? 'Edit Event Type' : 'Add a new event type'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Title"
                    required
                    placeholder="Quick Chat"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                />
                <Input
                    label="URL Slug"
                    required
                    placeholder="quick-chat"
                    value={slug}
                    onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugManuallyEdited(true);
                    }}
                />
                <Textarea
                    label="Description"
                    placeholder="A brief description of the event..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                    label="Duration (minutes)"
                    required
                    type="number"
                    min={5}
                    max={480}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {editingEventType ? 'Save Changes' : 'Create'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
