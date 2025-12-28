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
    const [showFolderSelector, setShowFolderSelector] = useState(false)

    // --- Content Extraction Logic ---
    let fullText = newsItem.summary || ''

    // 1. Extract Priority and Recommendation from anywhere in the text
    const prioMatch = fullText.match(/Prioridad:\s*(LOW|MED|HIGH|ALERT)/i)
    const recMatch = fullText.match(/Recomendación:\s*([^\n.]+)/i)

    const priority = prioMatch ? prioMatch[1] : 'MED'
    const recommendation = recMatch ? recMatch[0] : null

    // 2. Clean the text (remove priority and recommendation tags)
    let cleanedText = fullText
    if (prioMatch) cleanedText = cleanedText.replace(prioMatch[0], '')
    if (recMatch) cleanedText = cleanedText.replace(recMatch[0], '')
    cleanedText = cleanedText.trim()

    // 3. Extract Lead (First 1-2 sentences of cleaned text)
    const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText]
    const lead = sentences.slice(0, 2).join(' ')
    const analysisText = sentences.slice(2).join(' ').trim()

    // Validation
    const isValid = !!(newsItem.title && newsItem.image_url && newsItem.original_url && lead)
    if (!isValid) return null

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
            const voices = window.speechSynthesis.getVoices()
            const googleVoice = voices.find(v => v.lang.includes('es-ES') && v.name.includes('Google')) || voices.find(v => v.lang.includes('es-ES'))
            if (googleVoice) utterance.voice = googleVoice
            window.speechSynthesis.speak(utterance)
            setIsPlaying(true)
            utterance.onend = () => setIsPlaying(false)
        }
    }

    const handleSaveClick = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
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

            {/* 1. Cabecera editorial */}
            <div className={styles.editorialHeader}>
                <span className={styles.date}>{new Date(newsItem.created_at).toLocaleDateString('es-ES')}</span>
                <span className={`${styles.priorityBadge} ${styles[priority.toLowerCase()]}`}>
                    {priority}
                </span>
                <span className={styles.section}>Página {pageNumber}</span>
            </div>

            {/* 2. Título principal */}
            <h1 className={styles.mainTitle}>{newsItem.title}</h1>

            {/* 3. Imagen destacada */}
            <div className={styles.featuredImageContainer}>
                <Image src={newsItem.image_url!} alt={newsItem.title} fill className={styles.featuredImage} />
            </div>

            {/* 4. Acciones rápidas */}
            <div className={styles.quickActions}>
                <button className={styles.pillButton} onClick={handlePlay}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isPlaying ? 'Parar' : 'Escuchar'}
                </button>
                <button className={styles.pillButton} onClick={handleSaveClick} disabled={isSaved}>
                    <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    {isSaved ? 'Guardado' : 'Guardar'}
                </button>
            </div>

            {/* 5. Lead editorial */}
            <div className={styles.editorialLead}>
                {lead}
            </div>

            {/* 6. Texto de análisis */}
            <div className={styles.analysisText}>
                {analysisText}
            </div>

            {/* 7. Bloque de recomendación */}
            {recommendation && (
                <div className={`${styles.recommendationBlock} ${priority === 'ALERT' ? styles.alert : ''}`}>
                    <div className={styles.recLine}>{recommendation}</div>
                </div>
            )}

            {/* 8. Fuente */}
            <div className={styles.sourceLine}>
                Fuente: <a href={newsItem.original_url} target="_blank" rel="noopener noreferrer">{newsItem.original_url}</a>
            </div>

            {/* 9. Footer del artículo */}
            <div className={styles.articleFooter}>
                <a href={newsItem.original_url} target="_blank" rel="noopener noreferrer" className={styles.fullArticleLink}>
                    Leer artículo completo →
                </a>
            </div>
        </div>
    )
})

NewsPage.displayName = 'NewsPage'

export default NewsPage
