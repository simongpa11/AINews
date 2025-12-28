import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Folder } from '@/types'
import { Plus, Folder as FolderIcon, Check } from 'lucide-react'
import styles from './FolderSelector.module.css'

interface FolderSelectorProps {
    onSelect: (folderId: string | null) => void
    onClose: () => void
}

export default function FolderSelector({ onSelect, onClose }: FolderSelectorProps) {
    const [folders, setFolders] = useState<Folder[]>([])
    const [newFolderName, setNewFolderName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchFolders()
    }, [])

    const fetchFolders = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
            .order('name')

        if (data) setFolders(data)
        setLoading(false)
    }

    const createFolder = async () => {
        if (!newFolderName.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('folders')
            .insert({ name: newFolderName, user_id: user.id })
            .select()
            .single()

        if (data) {
            setFolders([...folders, data])
            setNewFolderName('')
            setIsCreating(false)
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3>Save to...</h3>

                <div className={styles.list}>
                    <button className={styles.item} onClick={() => onSelect(null)}>
                        <FolderIcon size={16} />
                        <span>General (No Folder)</span>
                    </button>

                    {folders.map(folder => (
                        <button key={folder.id} className={styles.item} onClick={() => onSelect(folder.id)}>
                            <FolderIcon size={16} />
                            <span>{folder.name}</span>
                        </button>
                    ))}
                </div>

                {isCreating ? (
                    <div className={styles.createForm}>
                        <input
                            type="text"
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                        <button onClick={createFolder}><Check size={16} /></button>
                    </div>
                ) : (
                    <button className={styles.createButton} onClick={() => setIsCreating(true)}>
                        <Plus size={16} /> New Folder
                    </button>
                )}

                <button className={styles.closeButton} onClick={onClose}>Cancel</button>
            </div>
        </div>
    )
}
