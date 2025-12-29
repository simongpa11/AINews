'use client'
import { useState, useEffect, useRef } from 'react'
import { News } from '@/types'
import NewsPage from './NewsPage'
import IndexPage from './IndexPage'
import LibraryPage from './LibraryPage'
import styles from './Newspaper.module.css'
import { ChevronDown, ChevronUp, Mic, Play, Pause } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NewspaperProps {
    editions: {
        date: string
        news: News[]
    }[]
}

export default function Newspaper({ editions }: NewspaperProps) {
    const [mounted, setMounted] = useState(false)
    const horizontalScrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const scrollToToday = () => {
        horizontalScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
    }

    return (
        <div className={styles.horizontalContainer} ref={horizontalScrollRef}>
            {editions.map((edition, editionIdx) => (
                <div key={edition.date} className={styles.editionWrapper}>
                    <DailyEdition
                        edition={edition}
                        isToday={editionIdx === 0}
                        onGoToToday={scrollToToday}
                    />
                </div>
            ))}
        </div>
    )
}

interface DailyEditionProps {
    edition: { date: string; news: News[] }
    isToday: boolean
    onGoToToday: () => void
}

function DailyEdition({ edition, isToday, onGoToToday }: DailyEditionProps) {
    const [podcastUrl, setPodcastUrl] = useState<string | null>(null)
    const [isPodcastPlaying, setIsPodcastPlaying] = useState(false)
    const podcastAudioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        fetchPodcast()
    }, [edition.date])

    const fetchPodcast = async () => {
        const { data } = await supabase
            .from('daily_metadata')
            .select('podcast_url')
            .eq('date', edition.date)
            .single()

        if (data?.podcast_url) {
            setPodcastUrl(data.podcast_url)
        } else {
            setPodcastUrl(null)
        }
    }

    const handlePodcastToggle = () => {
        if (!podcastUrl) return
        if (isPodcastPlaying) {
            podcastAudioRef.current?.pause()
            setIsPodcastPlaying(false)
        } else {
            if (!podcastAudioRef.current) {
                podcastAudioRef.current = new Audio(podcastUrl)
                podcastAudioRef.current.onended = () => setIsPodcastPlaying(false)
            }
            podcastAudioRef.current.play()
            setIsPodcastPlaying(true)
        }
    }

    const navigateTo = (id: string) => {
        const element = document.getElementById(id)
        element?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className={styles.scrollContainer}>
            {!isToday && (
                <button className={styles.todayButton} onClick={onGoToToday}>
                    Hoy
                </button>
            )}
            {/* Cover */}
            <section id={`cover-${edition.date}`} className={styles.fullPage}>
                <div className={styles.cover}>

                    {isToday && (
                        <div className={styles.archiveHint}>
                            <span>Hemeroteca (Desliza →)</span>
                        </div>
                    )}

                    <h1>Noticias IA Diarias</h1>
                    <p>{new Date(edition.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    {podcastUrl && (
                        <button className={styles.podcastButton} onClick={handlePodcastToggle}>
                            <div className={styles.podcastIconWrapper}>
                                {isPodcastPlaying ? <Pause size={24} /> : <Mic size={24} />}
                            </div>
                            <span>{isPodcastPlaying ? 'Pausar Podcast' : 'Escuchar Podcast'}</span>
                        </button>
                    )}

                    <div className={styles.scrollHint}>
                        <span>Desliza para leer</span>
                        <ChevronDown className={styles.bounce} />
                    </div>
                </div>
            </section>

            {/* Index */}
            <section id={`index-${edition.date}`} className={styles.fullPage}>
                <div className={styles.pageContent}>
                    <IndexPage news={edition.news} onNavigate={(index) => navigateTo(`news-${edition.date}-${index}`)} />
                </div>
            </section>

            {/* News Pages */}
            {edition.news.map((item, index) => (
                <section key={item.id} id={`news-${edition.date}-${index}`} className={styles.fullPage}>
                    <div className={styles.pageContent}>
                        <NewsPage newsItem={item} pageNumber={index + 1} />
                    </div>
                </section>
            ))}

            {/* Library (Only for today) */}
            {isToday && (
                <section id="page-library" className={styles.fullPage}>
                    <div className={styles.pageContent}>
                        <LibraryPage />
                    </div>
                </section>
            )}

            {/* Back Cover */}
            <section className={styles.fullPage}>
                <div className={styles.backCover}>
                    <h2>Fin de la Edición</h2>
                    <button onClick={() => navigateTo(`cover-${edition.date}`)} className={styles.topButton}>
                        <ChevronUp /> Volver al inicio
                    </button>
                </div>
            </section>
        </div>
    )
}
