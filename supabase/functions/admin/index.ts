import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SB_URL = Deno.env.get('SB_URL')!
const SR_KEY = Deno.env.get('SB_SR_KEY')!
const ADMIN_PW = Deno.env.get('ADMIN_PASSWORD')!

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      }
    })
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 })
  }

  const { password, action, payload } = await req.json()

  // Auth
  if (password !== ADMIN_PW) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }

  const db = createClient(SB_URL, SR_KEY)

  try {
    let result: any = { ok: true }
    switch (action) {
      case 'stats': {
        const { data } = await db.from('linli_codes').select('*').order('created_at', { ascending: false }).limit(200)
        result = data
        break
      }
      case 'stats_full': {
        const { data } = await db.from('linli_codes').select('*').order('created_at', { ascending: false }).limit(500)
        const { data: fb } = await db.from('feedbacks').select('*').order('created_at', { ascending: false }).limit(100)
        const { data: pv } = await db.from('page_visits').select('id').limit(100000)
        result = { codes: data, feedbacks: fb, pageVisits: pv?.length || 0 }
        break
      }
      case 'approve': {
        await db.from('linli_codes').update({ status: 'approved' }).eq('id', payload.id)
        break
      }
      case 'reject': {
        await db.from('linli_codes').update({ status: 'rejected' }).eq('id', payload.id)
        break
      }
      case 'batch_approve': {
        await db.from('linli_codes').update({ status: 'approved' }).in('id', payload.ids)
        break
      }
      case 'batch_reject': {
        await db.from('linli_codes').update({ status: 'rejected' }).in('id', payload.ids)
        break
      }
      case 'delete': {
        await db.from('linli_codes').delete().eq('id', payload.id)
        break
      }
      case 'batch_delete': {
        await db.from('linli_codes').delete().in('id', payload.ids)
        break
      }
      case 'feedback_reply': {
        await db.from('feedbacks').update({ reply: payload.reply, reply_read: false, replied_at: new Date().toISOString() }).eq('id', payload.id)
        break
      }
      case 'feedback_delete': {
        await db.from('feedbacks').delete().eq('id', payload.id)
        break
      }
      case 'feedback_mark': {
        await db.from('feedbacks').update({ status: payload.status }).eq('id', payload.id)
        break
      }
      case 'check_pw': {
        // password already validated at top of function
        break
      }
      case 'check_totp': {
        // Pass through to RPC
        const { data: totpOk } = await db.rpc('check_totp', { code: payload.code })
        result = totpOk
        break
      }
      case 'update_tags': {
        await db.from('linli_codes').update({ tags: payload.tags }).eq('code', payload.code)
        break
      }
      case 'batch_update_tags': {
        for (const item of payload.items) {
          await db.from('linli_codes').update({ tags: item.tags }).eq('code', item.code)
        }
        break
      }
      case 'discuss_delete': {
        const { error } = await db.from('discussions').delete().eq('id', parseInt(payload.id))
        if (error) throw new Error(error.message)
        break
      }
      case 'discuss_create': {
        await db.from('discussions').insert({
          name: 'Admin',
          content: payload.content,
          parent_id: payload.parent_id || null,
          is_admin: true,
          pinned: false
        })
        break
      }
      case 'discuss_pin': {
        await db.from('discussions').update({ pinned: payload.pinned }).eq('id', parseInt(payload.id))
        break
      }
      default: {
        result = { error: 'unknown action' }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
})
