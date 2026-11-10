import { supabase } from './supabase.js';
import { accountPayload } from '../utils/ledger.js';
import { normalizeOptions } from '../config/options.js';

const fields =
  'id,user_id,service_name,login_url,login_id,registered_email,storage_location,storage_item,two_factor,category,status,billing,last_reviewed_on,notes,created_at,updated_at';

export async function listAccounts(userId) {
  const result = [];
  // Supabaseの1リクエストの件数上限を超える場合も一覧から漏らさない。
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from('accounts')
      .select(fields)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + 499);
    if (error) throw error;
    result.push(...data);
    if (data.length < 500) return result;
  }
}

export async function upsertAccount(account, userId) {
  const payload = accountPayload(account);
  const query = account.id
    ? supabase
        .from('accounts')
        .update(payload)
        .eq('id', account.id)
        .eq('user_id', userId)
    : supabase.from('accounts').insert({ ...payload, user_id: userId });
  const { data, error } = await query.select(fields).single();
  if (error) throw error;
  return data;
}

export async function removeAccount(id, userId) {
  const { data, error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function reviewAccount(id, userId, date) {
  const { data, error } = await supabase
    .from('accounts')
    .update({ last_reviewed_on: date })
    .eq('id', id)
    .eq('user_id', userId)
    .select(fields)
    .single();
  if (error) throw error;
  return data;
}

export async function readOptions(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('options')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return normalizeOptions(data?.options);
}

export async function readPhoneLines(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('options')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return normalizePhoneLines(data?.options?.phone_lines);
}

export async function writePhoneLines(phoneLines, userId) {
  const { data: current, error: readError } = await supabase
    .from('user_settings')
    .select('options')
    .eq('user_id', userId)
    .maybeSingle();
  if (readError) throw readError;
  const options = current?.options && typeof current.options === 'object'
    ? current.options
    : {};
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        options: { ...options, phone_lines: normalizePhoneLines(phoneLines) },
      },
      { onConflict: 'user_id' },
    )
    .select('options')
    .single();
  if (error) throw error;
  return normalizePhoneLines(data.options?.phone_lines);
}

export async function writeOptions(options, userId) {
  const { data: current, error: readError } = await supabase
    .from('user_settings')
    .select('options')
    .eq('user_id', userId)
    .maybeSingle();
  if (readError) throw readError;
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        options: {
          ...normalizeOptions(options),
          ...(Array.isArray(current?.options?.phone_lines)
            ? { phone_lines: normalizePhoneLines(current.options.phone_lines) }
            : {}),
        },
      },
      { onConflict: 'user_id' },
    )
    .select('options')
    .single();
  if (error) throw error;
  return normalizeOptions(data.options);
}

function normalizePhoneLines(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((line) => line && typeof line === 'object')
    .map((line) => ({
      id: typeof line.id === 'string' ? line.id : '',
      carrier: typeof line.carrier === 'string' ? line.carrier.trim().slice(0, 100) : '',
      phone_number: typeof line.phone_number === 'string' ? line.phone_number.trim().slice(0, 30) : '',
    }))
    .filter((line) => line.id && line.carrier && line.phone_number);
}
