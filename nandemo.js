var Twit = require('twit');
var KEYS = require('./keys.json');

var BOT_NAME = 'n_imanandemo';

var bot = new Twit({
    consumer_key: KEYS.consumer_key,
    consumer_secret: KEYS.consumer_secret,
    access_token: KEYS.access_token,
    access_token_secret: KEYS.access_token_secret
})

// 同じツイートばっかりしてるとスパム検知されるかと思って微妙に違うパターンを作っておく(効果があるとは言っていない)
var NANDEMO = [
    'ん?今なんでもするって言ったよね',
    'ん?今なんでもするって…',
    'ん?今何でもするって…',
    'ん？今なんでもするって言ったよね',
    'ん？今何でもするって言ったよね',
    'ん？今何でもするって…',
    'ん?',
    '今何でもするって…',
    '今なんでもするって…',
    '今なんでもするって言ったよね',
    '今何でもするって言ったよね'
];

// 既にリプライ済みの人のリスト
var repliedTo = [];

// 既にリプライ済みの人のリストをリセットする時刻
var nextUpdate;

function setNextUpdate() {
    nextUpdate = new Date();
    nextUpdate.setDate(nextUpdate.getDate() + 1);
    nextUpdate.setHours(0, 0, 0, 0);
}

function reply(tweet) {
    console.log(tweet.user.name + '(' + tweet.user.screen_name + '): ' + tweet.text);
    bot.post('statuses/update',
        {
            'status': '@' + tweet.user.screen_name + ' ' + NANDEMO[Math.floor(Math.random() * NANDEMO.length)],
            'in_reply_to_status_id': tweet.id_str
        },
        function(err, data, response) {
            repliedTo.push(tweet.user.id);
            console.log(data);
        });
}

function judge(data) {
    var tweets = data.statuses;
    
    // 1日おきに既にリプライした人のリストをリセット
    if (new Date().getTime() > nextUpdate.getTime()) {
        repliedTo = [];
        setNextUpdate();
    }
    
    // 既にリプライ済みの人を除外
    tweets.filter(function (tweet) {
        if (repliedTo.indexOf(tweet.user.id) >= 0) return false;
        else return true;
    });
    if (tweets.length) reply(tweets[0]);
}

function search() {
    bot.get('search/tweets',
        {
            q: '"なんでもします" OR "なんでもする" OR "何でもする" OR "何でもします" OR "何でもやる" OR "なんでもやる" -from:@' + BOT_NAME,
            result_type: 'recent',
            count: 100
        }, function (err, data, response) {
            judge(data);
        });
}

setNextUpdate();
search();
setInterval(search, 1000 * 60 * 30);