var Twit = require('twit');
var ACCOUNTS = require('./accounts');

var bots = [];
ACCOUNTS.forEach(function (ACCOUNT) {
    bots.push(new Twit({
        consumer_key: ACCOUNT.consumer_key,
        consumer_secret: ACCOUNT.consumer_secret,
        access_token: ACCOUNT.access_token,
        access_token_secret: ACCOUNT.access_token_secret
    }));
});

var excludeBots = '';
ACCOUNTS.forEach(function (ACCOUNT) {
    excludeBots += ' -from:@' + ACCOUNT.screen_name ;
});

var botIndex = null;

// 同じツイートばっかりしてるとスパム検知されるかと思って微妙に違うパターンを作っておく(効果があるとは言っていない)
var NANDEMO = [
    'ん?今なんでもするって言ったよね',
    'ん?今なんでもするって…',
    'ん?今何でもするって…',
    'ん？今なんでもするって言ったよね',
    'ん？今何でもするって言ったよね',
    'ん？今何でもするって…'
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
setNextUpdate();

function reply(tweet) {
    console.log(tweet.user.name + '(' + tweet.user.screen_name + '): ' + tweet.text);
    
    var bot = bots[botIndex];
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
    // 1日おきに既にリプライした人のリストをリセット
    if (new Date().getTime() > nextUpdate.getTime()) {
        repliedTo = [];
        setNextUpdate();
    }
    
    var tweets = data.statuses;
    
    // 既にリプライ済みの人を除外
    tweets.filter(function (tweet) {
        if (repliedTo.indexOf(tweet.user.id) >= 0) return false;
        else return true;
    });
    
    if (tweets.length > 0) reply(tweets[0]);
}

function search() {
    var bot = bots[botIndex];
    
    bot.get('search/tweets',
        {
            q: '"なんでもします" OR "なんでもする" OR "何でもする" OR "何でもします" OR "何でもやる" OR "なんでもやる" -? -？ exclude:retweets' + excludeBots,
            result_type: 'recent',
            count: 100
        }, function (err, data, response) {
            if (!err) judge(data);
        });
}

function nextBotIndex() {
    if (botIndex == null) {
        botIndex = 0;
    } else if (botIndex >= bots.length - 1) {
        botIndex = 0;
    } else {
        botIndex++;
    }
    
    search();
}

nextBotIndex();
setInterval(nextBotIndex, 1000 * 60 * 40 / bots.length);