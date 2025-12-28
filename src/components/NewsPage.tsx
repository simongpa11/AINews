import { News } from '@/types'
import Image from 'next/image'
import { Play, Bookmark, Pause } from 'lucide-react'
import styles from './NewsPage.module.css'
import { forwardRef, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import FolderSelector from './FolderSelector'

interface NewsPageProps {
    newsItem: News
    pageNumber: number
}

const NewsPage = forwardRef<HTMLDivElement, NewsPageProps>(({ newsItem, pageNumber }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const handlePlay = () => {
        if (isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
            window.speechSynthesis.cancel()
            setIsPlaying(false)
            return
        }

        if (newsItem.audio_url) {
            if (!audioRef.current) {
                audioRef.current = new Audio(newsItem.audio_url)
                audioRef.current.onended = () => setIsPlaying(false)
            }
            audioRef.current.play()
            setIsPlaying(true)
        } else {
            const utterance = new SpeechSynthesisUtterance(newsItem.summary)
            utterance.lang = 'es-ES'

            // Try to select a high quality Google voice if available in the browser
            const voices = window.speechSynthesis.getVoices()
            const googleVoice = voices.find(v =>
                v.lang.includes('es-ES') && v.name.includes('Google')
            ) || voices.find(v => v.lang.includes('es-ES'))

            if (googleVoice) {
                utterance.voice = googleVoice
            }

            window.speechSynthesis.speak(utterance)
            setIsPlaying(true)
            utterance.onend = () => setIsPlaying(false)
        }
    }

    const [showFolderSelector, setShowFolderSelector] = useState(false)

    const handleSaveClick = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            // For demo purposes, we might want to allow a dummy login or alert
            // But since we don't have a login UI, let's just alert
            const email = prompt('Enter email to login/signup (Magic Link):')
            if (email) {
                await supabase.auth.signInWithOtp({ email })
                alert('Check your email for the login link!')
            }
            return
        }
        setShowFolderSelector(true)
    }

    const handleFolderSelect = async (folderId: string | null) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('saved_news').insert({
            news_id: newsItem.id,
            user_id: user.id,
            folder_id: folderId
        })

        if (error) {
            if (error.code === '23505') {
                alert('Already saved!')
                setIsSaved(true)
            } else {
                console.error(error)
                alert('Error saving news')
            }
        } else {
            setIsSaved(true)
        }
        setShowFolderSelector(false)
    }

    return (
        <div className={styles.container} ref={ref}>
            {showFolderSelector && (
                <FolderSelector
                    onSelect={handleFolderSelect}
                    onClose={() => setShowFolderSelector(false)}
                />
            )}
            <div className={styles.header}>
                <span className={styles.date}>{new Date(newsItem.created_at).toLocaleDateString('es-ES')}</span>
                <span className={styles.pageNumber}>Página {pageNumber}</span>
            </div>

            <h2 className={styles.title}>{newsItem.title}</h2>

            {newsItem.image_url && (
                <div className={styles.imageContainer}>
                    <Image src={newsItem.image_url} alt={newsItem.title} fill className={styles.image} />
                </div>
            )}

            <div className={styles.actions}>
                <button className={styles.playButton} onClick={handlePlay}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    {isPlaying ? 'Parar' : 'Escuchar'}
                </button>
                <button className={styles.saveButton} onClick={handleSaveClick} disabled={isSaved}>
                    <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                    {isSaved ? 'Guardado' : 'Guardar'}
                </button>
            </div>

            <div className={styles.content}>
                <p>{newsItem.summary}</p>
            </div>

            <div className={styles.footer}>
                {newsItem.original_url && (
                    <a href={newsItem.original_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        Leer artículo completo -&gt;
                    </a>
                )}
            </div>
        </div>
    )
})

NewsPage.displayName = 'NewsPage'

export default NewsPage
