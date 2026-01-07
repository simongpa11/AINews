import { News } from '@/types'
import styles from './IndexPage.module.css'
import { forwardRef } from 'react'

interface IndexPageProps {
    news: News[]
    onNavigate: (index: number) => void
}

const IndexPage = forwardRef<HTMLDivElement, IndexPageProps>(({ news, onNavigate }, ref) => {
    return (
        <div className={styles.container} ref={ref}>
            <h2 className={styles.title}>Índice</h2>
            <ul className={styles.list}>
                {news.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No han habido noticias relevantes el día de hoy.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.8 }}>Vuelve mañana para más actualizaciones.</p>
                    </div>
                ) : (
                    news.map((item, index) => (
                        <li key={item.id} className={styles.item} onClick={() => onNavigate(index)}>
                            <span className={styles.itemTitle}>{item.title}</span>
                            <span className={styles.score}>Relevancia: {item.relevance_score}/10</span>
                        </li>
                    ))
                )}
            </ul>
        </div>
    )
})

IndexPage.displayName = 'IndexPage'

export default IndexPage
