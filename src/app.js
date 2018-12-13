#!/usr/bin/env node
const spinner = require('cli-spinner').Spinner;
const colors = require('colors');
const request = require('superagent');

const [,, ...args] = process.argv;
const query = (args.includes(',')) ? args.replace(/,/g, " ") : args;

let loadingSpinner;

// Statics
const helpMessage = `
  HELP-MEH

  simply use the command like this: help-meh "i need helpz"
`

// Helper Functions
const lg = (message, error =  false) => {
    let culler = (error) ? colors.red : colors.green;
    console.log(culler(message));
}

const sanitizeString = (string) => {
    string = string.join();
    return escape(string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // $& means the whole matched string
}

const loading = (stop = false) => {
    if(stop && loadingSpinner) {
        loadingSpinner.stop();
        loadingSpinner = null;
        console.log("");
    } else {
        loadingSpinner = new spinner("searching.. %s");
        loadingSpinner.setSpinnerString('|/-\\');
        loadingSpinner.start();
    }
}

// Net Functions
const formatSOItem = (item) => {
    return `
        ${item.title}
        -----------------------------
        Answer Accepted: ${ item.is_answered ? colors.blue("yes") : colors.yellow("no") }
        Answers: ${item.answer_count}
        Views: ${item.view_count}
        Link: ${item.link}

        ____________________________________________________________

    `
}

const getQuery = (searchString) => {
    searchString = sanitizeString(searchString);
    return new Promise((result, error) => {
        request
            .get(`https://api.stackexchange.com/2.2/search/advanced?order=asc&sort=activity&title=${searchString}&site=stackoverflow&pagesize=3`)
            .query({done:true})
            .end((err, res) => {

                if(err) {
                    error(err);
                } else {
                    try {
                        const json = res.body;
                        if(json.items.length > 0) {

                            let finishedArray = [];
                            for(let i = 0; i < json.items.length; i++) {
                                const item = formatSOItem(json.items[i]);
                                finishedArray.push(item);
                            }

                            result(finishedArray);

                        } else {
                            error("No results found");
                        }

                    } catch(e) {
                        error(e);
                    }
                }

            });

    });
}

if(query.length <= 0) {
    lg(helpMessage, true);
    return;
}

loading();
getQuery(query).then(
    result => {
        loading(true);
        result.forEach(item => {
            lg(item);
        });
    },
    error => {
        loading(true);
        lg(error, true);
    }
)