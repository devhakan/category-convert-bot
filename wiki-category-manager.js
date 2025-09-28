#!/usr/bin/env node

const { program } = require('commander');
const axios = require('axios');
const fs = require('fs').promises;

class WikiCategoryManager {
  constructor() {
    this.enWikiAPI = 'https://en.wikipedia.org/w/api.php';
    this.trWikiAPI = 'https://tr.wikipedia.org/w/api.php';
    this.wikidataAPI = 'https://www.wikidata.org/w/api.php';
    
    this.config = null;
    this.cookies = '';
    this.editToken = null;
    this.userAgent = null;
    this.apiUrl = null;
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile('config.json', 'utf8');
      this.config = JSON.parse(configData);
      this.apiUrl = this.config.api_url;
      this.userAgent = this.config.user_agent;
      return true;
    } catch (error) {
      console.error('❌ Config dosyası okunamadı:', error.message);
      return false;
    }
  }

  getRequestConfig() {
    return {
      headers: {
        'User-Agent': this.userAgent,
        'Cookie': this.cookies
      },
      timeout: 30000
    };
  }

  async getLoginToken() {
    const response = await axios.get(this.apiUrl, {
      params: {
        action: 'query',
        meta: 'tokens',
        type: 'login',
        format: 'json'
      },
      headers: {
        'User-Agent': this.userAgent
      },
      timeout: 15000
    });

    const setCookies = response.headers['set-cookie'];
    if (setCookies) {
      this.cookies = setCookies.map(cookie => cookie.split(';')[0]).join('; ');
    }

    return response.data.query.tokens.logintoken;
  }

  async login() {
    const loginToken = await this.getLoginToken();
    
    const formData = new URLSearchParams();
    formData.append('action', 'login');
    formData.append('lgname', this.config.username);
    formData.append('lgpassword', this.config.password);
    formData.append('lgtoken', loginToken);
    formData.append('format', 'json');

    const response = await axios.post(this.apiUrl, formData, {
      headers: {
        'User-Agent': this.userAgent,
        'Cookie': this.cookies,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    const result = response.data.login;
    if (result && result.result === 'Success') {
      const setCookies = response.headers['set-cookie'];
      if (setCookies) {
        this.cookies = setCookies.map(cookie => cookie.split(';')[0]).join('; ');
      }
      return true;
    } else {
      console.error('❌ Giriş hatası:', result?.result || 'Bilinmeyen hata');
      if (result?.reason) {
        console.error('📝 Sebep:', result.reason);
      }
      return false;
    }
  }

  async getEditToken() {
    const response = await axios.get(this.apiUrl, {
      params: {
        action: 'query',
        meta: 'tokens',
        format: 'json'
      },
      ...this.getRequestConfig()
    });

    this.editToken = response.data.query.tokens.csrftoken;
    return this.editToken;
  }

  async getEnglishCategoryMembers(categoryName) {
    let allMembers = [];
    let cmcontinue = null;

    do {
      const params = {
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Category:${categoryName}`,
        cmlimit: 500,
        format: 'json'
      };

      if (cmcontinue) {
        params.cmcontinue = cmcontinue;
      }

      const response = await axios.get(this.enWikiAPI, { params });
      const data = response.data;
      const members = data.query?.categorymembers || [];
      
      allMembers = allMembers.concat(members.map(member => ({
        title: member.title,
        pageid: member.pageid
      })));

      cmcontinue = data.continue?.cmcontinue;
      
      // Rate limiting
      if (cmcontinue) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } while (cmcontinue);

    return allMembers;
  }

  async getTurkishCategoryMembers(categoryName) {
    let allMembers = [];
    let cmcontinue = null;

    do {
      const params = {
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Kategori:${categoryName}`,
        cmlimit: 500,
        format: 'json'
      };

      if (cmcontinue) {
        params.cmcontinue = cmcontinue;
      }

      const response = await axios.get(this.trWikiAPI, { params });
      const data = response.data;
      const members = data.query?.categorymembers || [];
      
      allMembers = allMembers.concat(members);

      cmcontinue = data.continue?.cmcontinue;
      
      // Rate limiting
      if (cmcontinue) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } while (cmcontinue);

    return new Set(allMembers.map(member => member.title));
  }

  async getTurkishWikidataId(trTitle) {
    const params = {
      action: 'query',
      prop: 'pageprops',
      ppprop: 'wikibase_item',
      titles: trTitle,
      format: 'json'
    };

    const response = await axios.get(this.trWikiAPI, { params });
    const pages = response.data.query?.pages || {};
    
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.pageprops?.wikibase_item) {
        return page.pageprops.wikibase_item;
      }
    }
    return null;
  }

  async getWikidataId(enTitle) {
    const params = {
      action: 'query',
      prop: 'pageprops',
      ppprop: 'wikibase_item',
      titles: enTitle,
      format: 'json'
    };

    const response = await axios.get(this.enWikiAPI, { params });
    const pages = response.data.query?.pages || {};
    
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.pageprops?.wikibase_item) {
        return page.pageprops.wikibase_item;
      }
    }
    return null;
  }

  async getEnglishTitle(wikidataId) {
    const params = {
      action: 'wbgetentities',
      ids: wikidataId,
      props: 'sitelinks',
      sitefilter: 'enwiki',
      format: 'json'
    };

    const response = await axios.get(this.wikidataAPI, { params });
    const entity = response.data.entities?.[wikidataId];
    
    if (entity?.sitelinks?.enwiki) {
      return entity.sitelinks.enwiki.title;
    }
    return null;
  }

  async getTurkishTitle(wikidataId) {
    const params = {
      action: 'wbgetentities',
      ids: wikidataId,
      props: 'sitelinks',
      sitefilter: 'trwiki',
      format: 'json'
    };

    const response = await axios.get(this.wikidataAPI, { params });
    const entity = response.data.entities?.[wikidataId];
    
    if (entity?.sitelinks?.trwiki) {
      return entity.sitelinks.trwiki.title;
    }
    return null;
  }

  async getEnglishCategoryName(turkishCategoryName) {
    const wikidataId = await this.getTurkishWikidataId(`Kategori:${turkishCategoryName}`);
    if (!wikidataId) {
      throw new Error(`Türkçe kategori için Wikidata ID bulunamadı: ${turkishCategoryName}`);
    }

    const englishCategoryName = await this.getEnglishTitle(wikidataId);
    if (!englishCategoryName) {
      throw new Error(`İngilizce kategori karşılığı bulunamadı: ${turkishCategoryName}`);
    }

    return englishCategoryName.replace('Category:', '');
  }

  async findMissingArticles(turkishCategoryName) {
    console.log(`🔍 Kategori analiz ediliyor: ${turkishCategoryName}`);
    
    const englishCategoryName = await this.getEnglishCategoryName(turkishCategoryName);
    console.log(`📋 İngilizce karşılık: ${englishCategoryName}`);
    
    const englishArticles = await this.getEnglishCategoryMembers(englishCategoryName);
    const turkishArticles = await this.getTurkishCategoryMembers(turkishCategoryName);
    
    console.log(`📊 İngilizce: ${englishArticles.length} madde | Türkçe: ${turkishArticles.size} madde`);
    console.log(`🔄 Eksik maddeler kontrol ediliyor...`);
    
    const missingArticles = [];
    
    for (let i = 0; i < englishArticles.length; i++) {
      const article = englishArticles[i];
      
      // Progress göster
      if (i % 10 === 0 || i === englishArticles.length - 1) {
        process.stdout.write(`\r   📊 İlerleme: ${i + 1}/${englishArticles.length} (${Math.round((i + 1) / englishArticles.length * 100)}%)`);
      }
      
      const wikidataId = await this.getWikidataId(article.title);
      if (!wikidataId) continue;
      
      const turkishTitle = await this.getTurkishTitle(wikidataId);
      if (!turkishTitle) continue;
      
      if (!turkishArticles.has(turkishTitle)) {
        missingArticles.push({
          english: article.title,
          turkish: turkishTitle,
          wikidataId: wikidataId
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n✅ Analiz tamamlandı: ${missingArticles.length} eksik madde bulundu`);
    return missingArticles;
  }

  async getPageContent(pageTitle) {
    const response = await axios.get(this.apiUrl, {
      params: {
        action: 'query',
        prop: 'revisions',
        titles: pageTitle,
        rvprop: 'content',
        rvslots: 'main',
        format: 'json'
      },
      ...this.getRequestConfig()
    });

    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (page.missing) return null;

    if (page.revisions && page.revisions[0] && page.revisions[0].slots.main) {
      return page.revisions[0].slots.main['*'];
    }

    return null;
  }

  async addCategoryToPage(pageTitle, categoryName) {
    const content = await this.getPageContent(pageTitle);
    if (!content) return false;

    const categoryPattern = new RegExp(`\\[\\[Kategori:${categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'i');
    if (categoryPattern.test(content)) {
      return true;
    }

    let newContent = content;
    const categoryToAdd = `[[Kategori:${categoryName}]]`;

    const existingCategoryMatch = content.match(/\[\[Kategori:[^\]]+\]\]/g);
    
    if (existingCategoryMatch) {
      const lastCategoryIndex = content.lastIndexOf('[[Kategori:');
      const lastCategoryEnd = content.indexOf(']]', lastCategoryIndex) + 2;
      newContent = content.slice(0, lastCategoryEnd) + '\n' + categoryToAdd + content.slice(lastCategoryEnd);
    } else {
      newContent = content.trim() + '\n\n' + categoryToAdd;
    }

    return await this.editPage(pageTitle, newContent, `[[Kategori:${categoryName}]] kategorisi eklendi`);
  }

  async editPage(title, content, summary) {
    const formData = new URLSearchParams();
    formData.append('action', 'edit');
    formData.append('title', title);
    formData.append('text', content);
    formData.append('summary', summary);
    formData.append('token', this.editToken);
    formData.append('format', 'json');
    formData.append('bot', '1');

    const response = await axios.post(this.apiUrl, formData, {
      headers: {
        'User-Agent': this.userAgent,
        'Cookie': this.cookies,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    const result = response.data;
    return result.edit && result.edit.result === 'Success';
  }

  async processCategory(turkishCategoryName) {
    try {
      const missingArticles = await this.findMissingArticles(turkishCategoryName);
      
      if (missingArticles.length === 0) {
        console.log('✅ Tüm maddeler kategoride mevcut!');
        return;
      }

      console.log(`\n🎯 ${missingArticles.length} maddeye kategori eklenecek`);
      
      console.log('🔐 Wikipedia\'ya giriş yapılıyor...');
      const configLoaded = await this.loadConfig();
      if (!configLoaded) return;

      const loginSuccess = await this.login();
      if (!loginSuccess) {
        console.error('❌ Giriş başarısız');
        return;
      }

      await this.getEditToken();
      console.log('✅ Bot hazır!\n');

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < missingArticles.length; i++) {
        const article = missingArticles[i];
        
        console.log(`📝 ${i + 1}/${missingArticles.length}: ${article.turkish}`);
        
        const success = await this.addCategoryToPage(article.turkish, turkishCategoryName);
        
        if (success) {
          console.log('   ✅ Kategori eklendi');
          successCount++;
        } else {
          console.log('   ❌ Hata oluştu');
          errorCount++;
        }

        if (i < missingArticles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log('\n' + '='.repeat(50));
      console.log('📋 İŞLEM ÖZETİ:');
      console.log(`   ✅ Başarılı: ${successCount}`);
      console.log(`   ❌ Hatalı: ${errorCount}`);
      console.log(`   📊 Toplam: ${missingArticles.length}`);
      console.log('='.repeat(50));

    } catch (error) {
      console.error('❌ İşlem hatası:', error.message);
    }
  }
}

program
  .name('wiki-category-manager')
  .description('Türkçe Wikipedia kategorilerini yönetir')
  .version('1.0.0')
  .argument('<category>', 'Türkçe Wikipedia kategori adı (Kategori: öneki olmadan)')
  .action(async (categoryName) => {
    const manager = new WikiCategoryManager();
    await manager.processCategory(categoryName);
  });

program.parse();