const fs        = require('fs');
const request   = require('request');
const cheerio   = require('cheerio');
const axios     = require('axios');
const Twit      = require('twit')
const api       = require('./api');

//Set the parameters
const team      = 'Duisburg';
const home_team = 'K&ouml;n';
const hashtag   = '#MKOEMSV';
const url       ='https://www.ard-text.de/index.php?page=286'; 
let init_id     = true; //set to false to test
let init_id_sc  = true; //set to false to test

const regex = new RegExp("^.*"+team+".*$", "gm");
const tore_reg  = new RegExp("Tor[\\s\\S]*"+home_team+":","gm"); //The home team has to be entered here

const space_reg = /\s\s+/g;

let timerId = setInterval(() => scoreMachine(), 1 * 15 * 1000);
// scoreMachine();

// end of config

//Libraries of reactions
const neg       = JSON.parse(fs.readFileSync('negative.json', 'utf8'));
const neg_len   = neg.length;
const pos       = JSON.parse(fs.readFileSync('positive.json', 'utf8'));
const pos_len   = pos.length;

let live_score;
let live_score_cur  = ['0','0'];

let data_tore_len;
let data_tore_len_cur = 0;
let last_action = "Noch nix";

let data_tore;
let home_id;
let result;
let data;
let half_time;

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

function tweet(message) {
    T.post('statuses/update', { status: message }, function(err, data, response) {
        console.log("Tweet sent!")
      })
}

var T = new Twit(api);

function scoreMachine() {

axios({
    method: 'get',
    url
})
.then(function (response) 
{
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;

    console.log(dateTime);
    // console.clear();
    data = response.data;
    data_tore = data;
    data = data.match(regex);
    data = data[0].toString();
    let $ = cheerio.load(data);
    $ = cheerio.text($('nobr'));
    data = $;



    result = data.slice(-9).trim();
    live_score = result.slice(0,4).trim(); //this is keeping track of goals
    half_time = result.slice(4).trim();

    if (live_score.includes("-") == true) {
        console.log("Spiel hat nocht nicht begonnen");
    }
    else {
        
        data = data.split("-");
    
        //teams
        let home = data[0].trim(); //home team should be identified and clean
        let away = data[1].trim();
        let away_l = away.length;
        away = away.slice(0,away_l - 9).trim();
        away_l = away.length;

        away_dot = away.charAt(away_l-1);
        if(away_dot == ".") {away = away.slice(0,away_l - 1).trim();}

        live_score = live_score.split(":");
   

        //Uncomment to test
        // live_score = ['0','1'];
    

            //Check if it is home or away game
            if (home.includes(team) == true) 
            {
                home_id = true;     
            }
            else 
            {
                home_id = false;
            };

            //Initialize the scores
            if (init_id == true) {
                live_score_cur[0] = live_score[0];
                live_score_cur[1] = live_score[1];
                init_id = false;
            }

            if (home_id == true && live_score_cur[0] == live_score[0] && live_score_cur[0] >= live_score[0] && live_score_cur[1] == live_score[1] && live_score_cur[1] >= live_score[1]) {
                // console.log('Unentschieden')
            }
            else
                if (home_id == true && live_score_cur[0] != live_score[0] && live_score_cur[0] <= live_score[0]) {
                    var id = getRandomInt(pos_len)
                    message = (hashtag + " " + live_score[0] + ":" + live_score[1] + ". " + pos[id].phrase);
                    tweet(message);
                    console.log(hashtag + " " + live_score[0] + ":" + live_score[1] + ". " + pos[id].phrase);

            }
            else 
            if (home_id ==false && live_score_cur[1] == live_score[1] && live_score_cur[1] >= live_score[1] && live_score_cur[0] == live_score[0] && live_score_cur[0] >= live_score[0]) {
                // console.log("Unentschieden!")
            }
            else 
            if (home_id == false && live_score_cur[1] != live_score[1] && live_score_cur[1] <= live_score[1]) {
                var id = getRandomInt(pos_len)
                message = (hashtag + " " + live_score[0] + ":" + live_score[1] + ". " + pos[id].phrase);
                tweet(message);
                console.log(hashtag + " " + live_score[0] + ":" + live_score[1] + ". " + pos[id].phrase);
            }
            else {
                var id = getRandomInt(neg_len)
                //This is the only for MSV Games
                message = (hashtag + " " + live_score[0] + ":" + live_score[1] + ". " + neg[id].phrase);
                tweet(message);
                console.log(hashtag + " " + live_score[0] + ":" + live_score[1] + ". " + neg[id].phrase);
                // console.log("so ne scheisse man - immer der gleiche rotz");
            };

    //Copy the scores
    live_score_cur[0] = live_score[0];
    live_score_cur[1] = live_score[1];


   console.log("Es steht: " + live_score[0] + ":" + live_score[1]); 
   console.log("Letztes Ereignis: " + last_action);
   console.log("Es spielen: " + home  + " Vs " + away);

}
//TORMASCHIENE - START

data_tore = data_tore.match(tore_reg);

    if (!data_tore) {
        console.log("Noch kein Tor")
    }
    else {

    data_tore = data_tore[0].toString();
    $ = cheerio.load(data_tore);
    $ = cheerio.text($('nobr'));
    data_tore = $;

    data_tore = data_tore.slice(0, data_tore.length - home_team.length -1).trim();
    console.log(data_tore);
    data_tore = data_tore.replace(space_reg,' ');
    data_tore = data_tore.split(",");
    data_tore_len = data_tore.length;
    // console.log(data_tore_len + "," + data_tore_len_cur + "," + init_id_sc)

    //Initialize the scores
    if (init_id_sc == true) {
        data_tore_len_cur = data_tore_len;
        init_id_sc = false;
    }

    console.log(data_tore_len + "," + data_tore_len_cur + "," + init_id_sc)

    if (data_tore_len>0 && data_tore_len_cur != data_tore_len && init_id_sc == false) {
        last_action = data_tore[data_tore_len-1].trim();
        console.log(hashtag + " " + last_action);
        tweet(hashtag + " " + last_action);
        data_tore_len_cur = data_tore_len;
        init_id_sc = false;
    
        }   

    }

    // console.log(data_tore_len + "," + data_tore_len_cur + "," + init_id_sc)
//TORMASCHIENE - END
});
};