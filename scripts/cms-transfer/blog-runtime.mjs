import crypto from 'node:crypto';
export const blogEntities=['core-cms/blog-post-category','core-cms/blog-post','core-cms/localized-blog-content'];
export function assertBlogWritePath(p){if(!/^\/(?:core\/api\/(?:media-library|media)|core-cms\/api\/(?:blog-post-category|blog-post|localized-blog-content|block-template|page-context))\/save\.json$/.test(p))throw Error('Write outside blog scope');}
export function matchesBlog(ident,row,bindings,expected){const s=ident.selector;
 if(s.organizationCode&&row.organization?.code!==s.organizationCode)return false;
 if(ident.entity==='core/user')return row.fullname===s.fullname&&crypto.createHash('sha256').update(row.name||'').digest('hex')===s.loginSha256;
 if(ident.entity==='core/language')return row.id===s.iso3;
 if(ident.entity.endsWith('/blog-post-category'))return row.nls?.en?.NAME===s.name&&(row.slug??null)===(s.slug??null);
 if(ident.entity.endsWith('/localized-blog-content'))return row.blogPost?.id===bindings[s.blogPostKey]&&row.language?.id===s.languageIso3;
 if(ident.entity.endsWith('/blog-post')){
  if(row.permalink!==s.permalink)return false;
  if(!s.duplicatePermalink)return true;
  // Metadata is compared against the package, not a source numeric ID.
  const a={...(row.metadata||{})},b={...(expected?.metadata||{})};delete a.PUBLISHED_AT;delete b.PUBLISHED_AT;
  return JSON.stringify(sort(a))===JSON.stringify(sort(b))&&(row.slug??null)===(expected?.slug??null);
 }
 throw Error('Unknown blog identity');
}
function sort(v){if(Array.isArray(v))return v.map(sort);return v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;}
export function validateBlogScope(ops){
 const posts=ops.filter(o=>o.path==='/core-cms/api/blog-post/save.json').map(o=>o.bodyTemplate.entities[0]);
 if(posts.length!==77||posts.filter(p=>p.enabled).length!==60)throw Error('Unexpected blog scope');
 if(posts.some(p=>p.permalink==='/blog/service-wand-one-operational-system'))throw Error('Held post included');
 for(const o of ops)assertBlogWritePath(o.path);
 if(JSON.stringify(ops).includes('missing|'))throw Error('Unresolved held media');
}
