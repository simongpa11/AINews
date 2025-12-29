'use client'
import { News } from '@/types'
import styles from './ArchivePage.module.css'
import { Calendar, ChevronRight } from 'lucide-react'

interface ArchivePageProps {
    archive: News[]
    onNavigateToNews: (newsId: string) => void
}

export default function ArchivePage({ archive, onNavigateToNews }: ArchivePageProps) {
    // Group news by date
    const groupedNews = archive.reduce((acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
        if (!acc[date]) acc[date] = []
        acc[date].push(item)
        return acc
    }, {} as Record<string, News[]>)

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Calendar className={styles.icon} />
                <h1>Hemeroteca</h1>
                <p>Últimos 15 días</p>
            </div>

            <div className={styles.scrollArea}>
                {Object.entries(groupedNews).map(([date, items]) => (
                    <div key={date} className={styles.dateGroup}>
                        <h2 className={styles.dateTitle}>{date}</h2>
                        <div className={styles.newsList}>
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={styles.newsItem}
                                    onClick={() => window.open(item.original_url, '_blank')}
                                >
                                    <div className={styles.newsInfo}>
                                        <h3>{item.title}</h3>
                                        <span className={styles.relevance}>Prioridad {item.relevance_score}</span>
                                    </div>
                                    <ChevronRight size={20} className={styles.arrow} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {archive.length === 0 && (
                    <div className={styles.empty}>
                        <p>No hay noticias en la hemeroteca aún.</p>
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <span>Desliza hacia abajo para volver a la edición de hoy</span>
            </div>
        </div>
    )
}
