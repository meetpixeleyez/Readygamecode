const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p1 = fs.readFileSync('C:/Users/PC/.gemini/antigravity-ide/brain/aad22654-3491-4d21-9196-6521e60bf2b8/.system_generated/steps/237/content.md', 'utf-8');
  const p2 = fs.readFileSync('C:/Users/PC/.gemini/antigravity-ide/brain/aad22654-3491-4d21-9196-6521e60bf2b8/.system_generated/steps/238/content.md', 'utf-8');
  
  // Extract content between <div class="card-body"> and </div> or similar.
  // Actually, we can just extract the inner HTML of the main container.
  
  const extractPolicy = (html) => {
      const match = html.match(/<h2 class="mb-3">([^<]+)<\/h2>([\s\S]*?)<\/div>/i);
      if(match) {
          return match[2].trim();
      }
      // fallback
      const match2 = html.match(/<div class="card-body[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/i);
      return match2 ? match2[1].trim() : "Content not found";
  };
  
  let privacyHtml = extractPolicy(p1);
  let termsHtml = extractPolicy(p2);
  
  // Clean up
  privacyHtml = privacyHtml.replace(/<h2 class="mb-3">.*?<\/h2>/, '');
  termsHtml = termsHtml.replace(/<h2 class="mb-3">.*?<\/h2>/, '');
  
  console.log("Privacy html length:", privacyHtml.length);
  console.log("Terms html length:", termsHtml.length);
  
  // Update DB
  await prisma.frontend.upsert({
      where: {
          dataKeys_slug: { dataKeys: 'policy_pages.element', slug: 'privacy-policy' }
      },
      update: {
          dataValues: JSON.stringify({ title: 'Privacy Policy', body: privacyHtml })
      },
      create: {
          dataKeys: 'policy_pages.element',
          slug: 'privacy-policy',
          dataValues: JSON.stringify({ title: 'Privacy Policy', body: privacyHtml })
      }
  }).catch(async (e) => {
      // If unique constraint is different, just do findFirst and update
      const existing = await prisma.frontend.findFirst({ where: { slug: 'privacy-policy', dataKeys: 'policy_pages.element' }});
      if(existing) {
          await prisma.frontend.update({ where: { id: existing.id }, data: { dataValues: JSON.stringify({ title: 'Privacy Policy', body: privacyHtml }) } });
      } else {
          await prisma.frontend.create({ data: { slug: 'privacy-policy', dataKeys: 'policy_pages.element', dataValues: JSON.stringify({ title: 'Privacy Policy', body: privacyHtml }) } });
      }
  });
  
  await prisma.frontend.upsert({
      where: {
          dataKeys_slug: { dataKeys: 'policy_pages.element', slug: 'terms-of-service' }
      },
      update: {
          dataValues: JSON.stringify({ title: 'Terms of Service', body: termsHtml })
      },
      create: {
          dataKeys: 'policy_pages.element',
          slug: 'terms-of-service',
          dataValues: JSON.stringify({ title: 'Terms of Service', body: termsHtml })
      }
  }).catch(async (e) => {
      const existing = await prisma.frontend.findFirst({ where: { slug: 'terms-of-service', dataKeys: 'policy_pages.element' }});
      if(existing) {
          await prisma.frontend.update({ where: { id: existing.id }, data: { dataValues: JSON.stringify({ title: 'Terms of Service', body: termsHtml }) } });
      } else {
          await prisma.frontend.create({ data: { slug: 'terms-of-service', dataKeys: 'policy_pages.element', dataValues: JSON.stringify({ title: 'Terms of Service', body: termsHtml }) } });
      }
  });

  console.log("DB updated");
}

main();
