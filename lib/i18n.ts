export type Locale = 'en' | 'fr'

export const DEFAULT_LOCALE: Locale = 'en'

export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    pricing: 'Pricing',
    discover: 'Discover',
    join_us: 'Join us',
    sign_in: 'Sign in',
    tattoo_market: 'Tattoo Market',
    tattoo_but_smarter: 'Tattoo, but smarter',
    where_clients: 'Where clients meet the perfect artist',
    discover_description: 'Discover unique tattoo styles, chat without sharing phone numbers, and book with confidence. For artists, manage leads, chat, and grow your business—all in one place.',
    discover_artists: 'Discover artists',
    see_pricing: 'See pricing',
    appearance: 'Appearance',
    language: 'Language',
    preferences: 'Preferences',
  },
  fr: {
    pricing: 'Tarifs',
    discover: 'Découvrir',
    join_us: "Rejoignez-nous",
    sign_in: "Se connecter",
    tattoo_market: 'Marché du tatouage',
    tattoo_but_smarter: 'Tatouage, mais plus intelligent',
    where_clients: "Où les clients rencontrent l'artiste parfait",
    discover_description: "Découvrez des styles de tatouage uniques, discutez sans partager de numéros de téléphone et réservez en toute confiance. Pour les artistes, gérez les leads, discutez et développez votre activité — tout en un seul endroit.",
    discover_artists: "Découvrir des artistes",
    see_pricing: "Voir les tarifs",
    appearance: 'Apparence',
    language: 'Langue',
    preferences: 'Préférences',
  }
}

export const AVAILABLE_LOCALES: Locale[] = ['en', 'fr']
