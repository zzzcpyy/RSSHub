const cheerio = require('cheerio');
const puppeteer = require('../../utils/puppeteer');

module.exports = async (ctx) => {
    const qw  = ctx.params.qw;
    const link = `http://tieba.baidu.com/f/search/res?isnew=1&kw=&qw=${qw}&un=&rn=10&pn=0&sd=&ed=&sm=1&only_thread=1`;
    const browser = await puppeteer();
    const page = await browser.newPage();

    await page.goto(link, { waitUntil: 'networkidle0' });
    // eslint-disable-next-line no-undef
    const html = await page.evaluate(() => document.querySelector('html').innerHTML);
    browser.close();
    console.log(html);
    const $ = cheerio.load(html);
    const list = $('div.s_post_list>div.s_post:nth-child(n+2)');

    ctx.state.data = {
        title: `贴吧搜索`,
        link: `https://tieba.baidu.com/`,
        item:
            list &&
            list
                .map((index, element) => {
                    const item = $(element);
                    const url = item.find('span.p_title>a').attr('href');
                    const time = item.find('font.p_green.p_date').text().trim(); // prettier-ignore
                    const title = item.find('span.p_title>a').text().trim(); // prettier-ignore
                    const details = item.find('div.p_content').text().trim(); // prettier-ignore

                    return {
                        title,
                        description: details,
                        pubDate: time,
                        link: url,
                    };
                })
                .get(),
    };
};
