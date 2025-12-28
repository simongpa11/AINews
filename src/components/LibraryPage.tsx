import { useState, useEffect, forwardRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Folder, SavedNews } from '@/types'
import styles from './LibraryPage.module.css'
import { Folder as FolderIcon, FileText, ArrowLeft } from 'lucide-react'

interface LibraryPageProps { }

const LibraryPage = forwardRef<HTMLDivElement, LibraryPageProps>((props, ref) => {
    const [folders, setFolders] = useState<Folder[]>([])
    const [savedNews, setSavedNews] = useState<SavedNews[]>([])
    const [currentFolder, setCurrentFolder] = useState<string | null>(null) // null = root (folders list)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLibrary()
    }, [])

    const fetchLibrary = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        const [foldersRes, savedRes] = await Promise.all([
            supabase.from('folders').select('*').eq('user_id', user.id),
            supabase.from('saved_news').select('*, news(*)').eq('user_id', user.id)
        ])

        if (foldersRes.data) setFolders(foldersRes.data)
        if (savedRes.data) setSavedNews(savedRes.data)
        setLoading(false)
    }

    const filteredNews = currentFolder
        ? savedNews.filter(item => item.folder_id === currentFolder)
        : savedNews.filter(item => !item.folder_id) // Show unsorted news in root? Or just folders?
    // Let's show folders AND unsorted news in root

    const rootNews = savedNews.filter(item => !item.folder_id)

    if (loading) return <div className={styles.container} ref={ref}><p>Loading library...</p></div>

    return (
        <div className={styles.container} ref={ref}>
            <div className={styles.header}>
                {currentFolder && (
                    <button className={styles.backButton} onClick={() => setCurrentFolder(null)}>
                        <ArrowLeft size={16} /> Back
                    </button>
                )}
                <h2 className={styles.title}>
                    {currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'My Clippings'}
                </h2>
            </div>

            <div className={styles.content}>
                {!currentFolder && (
                    <>
                        <h3 className={styles.sectionTitle}>Folders</h3>
                        <div className={styles.grid}>
                            {folders.map(folder => (
                                <div key={folder.id} className={styles.folderCard} onClick={() => setCurrentFolder(folder.id)}>
                                    <FolderIcon size={32} />
                                    <span>{folder.name}</span>
                                    <span className={styles.count}>
                                        {savedNews.filter(n => n.folder_id === folder.id).length} items
                                    </span>
                                </div>
                            ))}
                        </div>

                        <h3 className={styles.sectionTitle}>Unsorted Clippings</h3>
                    </>
                )}

                <div className={styles.newsList}>
                    {(currentFolder ? filteredNews : rootNews).map(item => (
                        <div key={item.id} className={styles.newsItem}>
                            <FileText size={20} />
                            <div className={styles.newsInfo}>
                                <span className={styles.newsTitle}>{item.news?.title || 'Unknown Title'}</span>
                                <span className={styles.newsDate}>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {(currentFolder ? filteredNews : rootNews).length === 0 && (
                        <p className={styles.empty}>No clippings here.</p>
                    )}
                </div>
            </div>
        </div>
    )
})

LibraryPage.displayName = 'LibraryPage'

export default LibraryPage
