'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import FavoritesList from '../components/FavoritesList'
import SearchHistory from '../components/SearchHistory'
import { SearchHistory as SearchHistoryType } from '../types'

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { t } = useLanguage()
    const [history, setHistory] = useState<SearchHistoryType[]>([])
    const [loadingHistory, setLoadingHistory] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        const loadHistory = async () => {
            if (session?.user) {
                try {
                    const res = await fetch('/api/history')
                    if (res.ok) {
                        const data = await res.json()
                        setHistory(data.history.map((h: any) => ({
                            code: h.code,
                            system: h.system,
                            timestamp: new Date(h.searched_at).getTime()
                        })))
                    }
                } catch (error) {
                    console.error('Failed to load history', error)
                } finally {
                    setLoadingHistory(false)
                }
            }
        }
        if (status === 'authenticated') {
            loadHistory()
        }
    }, [session, status])

    const handleClearHistory = async () => {
        try {
            await fetch('/api/history', { method: 'DELETE' })
            setHistory([])
        } catch (error) {
            console.error('Failed to clear history', error)
        }
    }

    const handleSearchSelect = (code: string) => {
        router.push(`/?code=${code}`)
    }

    if (status === 'loading') {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    }

    if (!session) {
        return null
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t('dashboard')}
                </h1>
                <p className="text-base text-gray-700 dark:text-gray-400">
                    {t('welcome')}, {session.user.name || session.user.email}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Favorites Section */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {t('favoriteCodes')}
                    </h2>
                    <FavoritesList onSelectCode={handleSearchSelect} collapsible={false} />
                </div>

                {/* History Section */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {t('searchHistory')}
                    </h2>
                    {loadingHistory ? (
                        <p>Loading history...</p>
                    ) : (
                        <SearchHistory
                            history={history}
                            onSelect={handleSearchSelect}
                            onClear={handleClearHistory}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
