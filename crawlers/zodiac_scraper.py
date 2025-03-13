import requests
from bs4 import BeautifulSoup
import json
import os
from time import sleep

class ZodiacScraper:
    def __init__(self, base_url="https://www.buyiju.com"):
        self.base_url = base_url
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # 创建数据目录
        os.makedirs("data", exist_ok=True)
    
    def get_page(self, url):
        """获取页面内容"""
        try:
            response = requests.get(url, headers=self.headers)
            response.encoding = 'utf-8'  # 确保正确编码
            if response.status_code == 200:
                return response.text
            else:
                print(f"请求失败: {response.status_code}")
                return None
        except Exception as e:
            print(f"获取页面出错: {e}")
            return None
    
    def parse_main_page(self, url="/peidui/sxpd.php"):
        """解析主页面并提取所有链接"""
        full_url = self.base_url + url
        html = self.get_page(full_url)
        if not html:
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        
        # 提取生肖配对相关链接
        for a in soup.find_all('a'):
            href = a.get('href')
            text = a.text.strip()
            if href and ('sxpd' in href or 'peidui' in href) and text:
                if not href.startswith('http'):
                    href = self.base_url + href
                links.append({"text": text, "url": href})
        
        return links
    
    def parse_content_page(self, url):
        """解析内容页面"""
        html = self.get_page(url)
        if not html:
            return {}
        
        soup = BeautifulSoup(html, 'html.parser')
        content = {}
        
        # 提取标题
        title = soup.find('h1')
        content['title'] = title.text.strip() if title else "无标题"
        
        # 提取正文内容
        article = soup.find('div', class_='content') or soup.find('article')
        if article:
            content['content'] = article.get_text(separator='\n').strip()
            content['html'] = str(article)
        else:
            # 尝试其他方法提取内容
            main_content = soup.find_all('p')
            if main_content:
                content['content'] = '\n'.join([p.text.strip() for p in main_content])
            else:
                content['content'] = "无内容"
        
        return content
    
    def crawl_all(self):
        """爬取所有内容"""
        all_data = {}
        links = self.parse_main_page()
        
        for i, link in enumerate(links):
            print(f"正在爬取 ({i+1}/{len(links)}): {link['text']}")
            content = self.parse_content_page(link['url'])
            all_data[link['text']] = {
                "url": link['url'],
                "content": content
            }
            # 保存中间结果
            with open("data/zodiac_data.json", "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
            # 防止请求过于频繁
            sleep(1)
        
        print("爬取完成，数据已保存到 data/zodiac_data.json")
        return all_data

if __name__ == "__main__":
    scraper = ZodiacScraper()
    scraper.crawl_all()