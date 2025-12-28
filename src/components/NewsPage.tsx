import { News } from '@/types'
import Image from 'next/image'
import { Play, Bookmark, Pause, Bell, Link, Lightbulb } from 'lucide-react'
import styles from './NewsPage.module.css'
import { forwardRef, useState, useRef, useEffect } from 'react'
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
    const sourcesRef = useRef<HTMLDivElement | null>(null)
    const [showFolderSelector, setShowFolderSelector] = useState(false)
    const [showSources, setShowSources] = useState(false)

    // Close sources popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sourcesRef.current && !sourcesRef.current.contains(event.target as Node)) {
                setShowSources(false)
            }
        }
        if (showSources) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showSources])

    // --- Content Extraction Logic ---
    let fullText = newsItem.summary || ''

    // 1. Extract Priority and Recommendation from anywhere in the text
    const prioMatch = fullText.match(/(?:Prioridad|Priority):\s*(LOW|MED|HIGH|ALERT|BAJA|MEDIA|ALTA|ALERTA)/i)

    // Updated to match until end of line OR until it hits "Prioridad" or "Fuente"
    const recMatch = fullText.match(/(?:Recomendación|Recommendation|Acción recomendada):\s*([\s\S]*?)(?=\s*(?:Prioridad|Priority|Fuente|Source)|$)/i)

    // Extract ALL sources
    const sourceMatches = fullText.match(/(?:Fuente|Source):\s*(https?:\/\/[^\s,]+(?:,\s*https?:\/\/[^\s,]+)*)/i)
    let sources: string[] = []
    if (sourceMatches) {
        sources = sourceMatches[1].split(/,\s*/).map(s => s.trim())
    }
    // Always include original_url if not already there
    if (newsItem.original_url && !sources.includes(newsItem.original_url)) {
        sources.unshift(newsItem.original_url)
    }

    // Map translated priorities back to standard keys if needed
    const rawPriority = prioMatch ? prioMatch[1].toUpperCase() : 'MED'
    const priorityMap: { [key: string]: string } = {
        'BAJA': 'LOW',
        'MEDIA': 'MED',
        'ALTA': 'HIGH',
        'ALERTA': 'ALERT'
    }
    const priority = priorityMap[rawPriority] || rawPriority

    // Clean recommendation: remove trailing dots and ensure it doesn't contain priority/source tags
    let recommendation = recMatch ? recMatch[0].trim() : null
    if (recommendation) {
        recommendation = recommendation.replace(/\.\.+$/, '.')
        // Remove any stray tags that might have leaked in
        recommendation = recommendation.replace(/(?:Prioridad|Priority|Fuente|Source):.*$/gi, '').trim()
    }

    // 2. Clean the text (remove priority, recommendation, and source tags completely)
    let cleanedText = fullText
    if (prioMatch) cleanedText = cleanedText.replace(prioMatch[0], '')
    if (recMatch) cleanedText = cleanedText.replace(recMatch[0], '')
    if (sourceMatches) cleanedText = cleanedText.replace(sourceMatches[0], '')

    // Also catch variations and ensure no double line breaks are left
    cleanedText = cleanedText
        .replace(/Prioridad\s+(Baja|Media|Alta|Alerta)/gi, '')
        .replace(/(?:Recomendación|Recommendation|Acción recomendada):/gi, '')
        .replace(/(?:Fuente|Source):/gi, '')
        .replace(/\n\s*\n/g, '\n')
        .trim()

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
            alert('Audio no disponible para esta noticia.')
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
                    {priority === 'ALERT' ? (
                        <span className={styles.prioIcon}><Bell size={12} fill="currentColor" /></span>
                    ) : (
                        <span className={`${styles.prioDot} ${styles[priority.toLowerCase() + 'Dot']}`}></span>
                    )}
                    {priority}
                </span>
                <span className={styles.section}>Página {pageNumber}</span>
            </div>

            <div className={styles.scrollableContent}>
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

                    <div className={styles.sourcesWrapper} ref={sourcesRef}>
                        {showSources && (
                            <div className={styles.sourcesPopover}>
                                {sources.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className={styles.popoverLink} onClick={() => setShowSources(false)}>
                                        {new URL(url).hostname}
                                    </a>
                                ))}
                            </div>
                        )}
                        <button className={styles.pillButton} onClick={() => setShowSources(!showSources)}>
                            <Link size={18} />
                            Fuentes ({sources.length})
                        </button>
                    </div>
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
                        <div className={styles.recLine}>
                            <div className={styles.recHeader}>
                                <Lightbulb size={18} className={styles.recIcon} />
                                <strong>Acción recomendada:</strong>
                            </div>
                            <div className={styles.recText}>
                                {recommendation.replace(/^(?:Recomendación|Recommendation|Acción recomendada):\s*/i, '')}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* 8 & 9. Footer con Link */}
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
