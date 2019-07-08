const cheerio = require('cheerio');
const qs = require('querystring');
const axios = require('../../utils/axios');
const iconv = require('iconv-lite');

function isNormalTime(time) {
    return /^(\d{2}):(\d{2})$/.test(time);
}

function isNormalDate(time) {
    return /^(\d{1,2})-(\d{1,2})$/.test(time);
}

function isDate(time) {
    return /^(\d{4})-(\d{1,2})-(\d{1,2})$/.test(time);
}

function getPubDate(time) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    if (isNormalTime(time)) {
        return new Date(`${year}-${month}-${date} ${time}`);
    }
    if (isNormalDate(time)) {
        return new Date(`${year}-${time}`) > now ? new Date(`${year - 1}-${time}`) : new Date(`${year}-${time}`);
    }
    if (isDate(time)) {
        return new Date(time);
    }
    return now;
}

module.exports = async (ctx) => {
    const { qw } = ctx.params;

    // PC端：https://tieba.baidu.com/f?kw=${encodeURIComponent(kw)}
    // 移动端接口：https://tieba.baidu.com/mo/q/m?kw=${encodeURIComponent(kw)}&lp=5024&forum_recommend=1&lm=0&cid=0&has_url_param=1&pn=0&is_ajax=1
    const params = { qw: encodeURIComponent(qw) };
    const { data } = await axios({
        method: 'get',
        url: `http://tieba.baidu.com/f/search/res?isnew=1&kw=&qw=%E7%8C%AB&rn=10&un=&only_thread=0&sm=1&sd=&ed=&pn=2`,
        headers: {
            Referer: 'https://tieba.baidu.com/',
        },
    });
console.log(data);
    // const $ = cheerio.load(data);
    const $ = cheerio.load(iconv.decode(data, 'GBK'));
    const list = $('div.s_post_list>div.s_post:nth-child(n+2)');

    ctx.state.data = {
        title: `吧`,
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
