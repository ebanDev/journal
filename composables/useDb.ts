import type { Tables, TablesInsert } from '~/types/database.types'

export type ArticleWithCategories = Tables<'articles'> & {
  categories: Array<{ name: string, icon?: string }>
} 

// La Veille types
export type VeilleEntry = Tables<'laveille'> & {
  voteCount: number
  laveille_votes?: Array<{ id: string }>
}

export type VeilleVote = Tables<'laveille_votes'>

export type VeilleInsert = TablesInsert<'laveille'>

export function useDb() {
  const supabase = useSupabaseClient()

  // Create a new issue
  async function createNewIssue(data: { title: string; description?: string; status?: string }) {
    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
        title: data.title,
        description: data.description || '',
        status: data.status || 'draft',
      })
      .select('id')
      .single()
    if (error) throw error
    return issue
  }

  // Create a new article
  async function createNewArticle(data: { title?: string; content?: string; author_id: string; issue_id?: string }) {
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title: data.title || '',
        content: data.content || '',
        author_id: data.author_id,
        draft: true,
        issue_id: data.issue_id || null,
      })
      .select('id')
      .single()
    if (error) throw error
    return article
  }

  // Get all issues
  async function getIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('published_at', { ascending: false })
    if (error) throw error
    return data
  }

  // Get all articles (optionally filtered) with categories
  async function getArticles(filters?: Array<{ type: string, id: string }>) {
    let query = supabase
      .from('articles')
      .select('*, article_categories:article_categories(category_id, categories(name, icon))')

    if (filters && filters.length) {
      const issueFilter = filters.filter(f => f.type === 'issue').map(f => f.id)
      const categoryFilter = filters.filter(f => f.type === 'category').map(f => f.id)
      let articleIds: string[] | undefined = undefined
      if (categoryFilter.length) {
        // Get all article IDs that have any of the selected categories (OR logic within type)
        const { data: articleCatRows, error: catError } = await supabase
          .from('article_categories')
          .select('article_id')
          .in('category_id', categoryFilter)
        if (catError) throw catError
        articleIds = (articleCatRows || []).map((row: any) => row.article_id)
        if (!articleIds.length) return []
      }
      if (issueFilter.length && articleIds) {
        // AND logic between types: articles in (category1 OR category2) AND (issue3 OR issue4)
        query = query.in('id', articleIds).in('issue_id', issueFilter)
      } else if (issueFilter.length) {
        query = query.in('issue_id', issueFilter)
      } else if (articleIds) {
        query = query.in('id', articleIds)
      } else {
        // No matching articles
        return []
      }
    }
    const { data, error } = await query
    if (error) throw error
    // Attach categories as array of objects { name, icon }
    return (data || []).map((a: any) => ({
      ...a,
      categories: (a.article_categories || [])
        .map((ac: any) => ac.categories && { name: ac.categories.name, icon: ac.categories.icon })
        .filter(Boolean)
    }))
  }

  // Get a single issue by id
  async function getIssueById(id: string) {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  // Get a single article by id
  async function getArticleById(id: string) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  // Get a single article by slug (with categories)
  async function getArticleBySlug(slug: string) {
    const { data, error } = await supabase
      .from('articles')
      .select('*, article_categories:article_categories(category_id, categories(name, icon))')
      .eq('slug', slug)
      .single()
    if (error) throw error
    return {
      ...data,
      categories: (data.article_categories || [])
        .map((ac: any) => ac.categories && { name: ac.categories.name, icon: ac.categories.icon })
        .filter(Boolean)
    }
  }

  // Delete an issue by id
  async function deleteIssueById(id: string) {
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }

  // Delete an article by id
  async function deleteArticleById(id: string) {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }

  // CATEGORY HELPERS (many-to-many)
  // Get all categories
  async function getCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (error) throw error
    return data
  }

  // Add a category if it doesn't exist, return its id
  async function upsertCategory(name: string) {
    let { data: cat } = await supabase.from('categories').select('id').eq('name', name).single()
    if (!cat) {
      const { data: newCat, error } = await supabase.from('categories').insert({ name }).select().single()
      if (error) throw error
      cat = newCat
    }
    return cat.id
  }

  // Set categories for an article (replace all)
  async function setArticleCategories(articleId: string, categoryNames: string[]) {
    // Remove all
    await supabase.from('article_categories').delete().eq('article_id', articleId)
    // Insert new
    for (const name of categoryNames) {
      const catId = await upsertCategory(name)
      await supabase.from('article_categories').insert({ article_id: articleId, category_id: catId })
    }
  }

  // Get categories for an article
  async function getArticleCategories(articleId: string) {
    const { data, error } = await supabase
      .from('article_categories')
      .select('category_id, categories(name)')
      .eq('article_id', articleId)
    if (error) throw error
    return data?.map((row: any) => row.categories?.name).filter(Boolean) || []
  }

  // LA VEILLE FUNCTIONS
  
  // Get all approved la-veille entries with vote counts
  async function getVeilleEntries() {
    const { data, error } = await supabase
      .from('laveille')
      .select(`id, title, url, description, type, submitted_at, laveille_votes(id)`)
      .eq('status', 'approved')
    if (error) throw error
    
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      description: item.description,
      type: item.type,
      submitted_at: item.submitted_at,
      voteCount: item.laveille_votes?.length || 0
    })) as VeilleEntry[]
  }

  // Get user's votes for la-veille entries
  async function getUserVeilleVotes(userId: string) {
    const { data, error } = await supabase
      .from('laveille_votes')
      .select('article_id')
      .eq('voter_id', userId)
    if (error) throw error
    return new Set((data || []).map(v => v.article_id))
  }

  // Submit a new la-veille entry
  async function submitVeilleEntry(entry: VeilleInsert) {
    const { data, error } = await supabase
      .from('laveille')
      .insert(entry)
      .select()
      .single()
    if (error) throw error
    return data
  }

  // Vote on a la-veille entry
  async function voteVeilleEntry(articleId: string, userId: string) {
    const { data, error } = await supabase
      .from('laveille_votes')
      .insert({ article_id: articleId, voter_id: userId })
      .select()
      .single()
    if (error) throw error
    return data
  }

  // Remove vote from a la-veille entry
  async function unvoteVeilleEntry(articleId: string, userId: string) {
    const { error } = await supabase
      .from('laveille_votes')
      .delete()
      .eq('article_id', articleId)
      .eq('voter_id', userId)
    if (error) throw error
    return true
  }

  return {
    createNewIssue,
    createNewArticle,
    getIssues,
    getArticles,
    getIssueById,
    getArticleById,
    getArticleBySlug,
    deleteIssueById,
    deleteArticleById,
    getCategories,
    upsertCategory,
    setArticleCategories,
    getArticleCategories,
    // La Veille functions
    getVeilleEntries,
    getUserVeilleVotes,
    submitVeilleEntry,
    voteVeilleEntry,
    unvoteVeilleEntry
  }
}
