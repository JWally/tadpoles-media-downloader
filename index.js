// /////////////////////////////
//
// Script: TadpoleExcavator
// Purpose: Download all pictures and movies from tadpoles website
// How To: 
// 
//     1.) Use google chrome
//     2.) Log into tadpoles website
//     3.) Open "Dev Tools" in chrome
//          *Windows: ctrl+shift+c
//          *Mac: Command+Option+C
//          *nix: ???
//      4.) Paste this script in console
//      5.) Hit "Enter"
//
//
// NOTES: 
//      1.) To be safe, I'm giving each download about 3 seconds each, so this'll probably take an hour or two
//
//      2.) The first file downloaded *should* be called primrose.json. It's techie stuff, but has every notification
//          that primrose has ever sent out to you.
//
//      3.) If it doesn't work, or you run into any snags, feel free to reach out to me. Contact information is below.
//
// 
// Author: Justin Wolcott
//
// Contact: Justin.W.Wolcott@gmail.com
//
// /////////////////////////////



// *********************************************
//
// GLOBALS:
// - all_events: all primrose events
// - all_media: media extracted from the primrose events
// 
// *********************************************
document.all_events = [];
document.all_media = [];

//
// In order to get a list of pictures / events / etc for a month, you can pull them from
// a tadpoles URL that takes 2 date arguments
//
// This functino takes 2 dates and spits out a decent looking URL.
// No data validation, so be careful...
//
function url_maker(start_date, stop_date){
    
    //
    // Step 1: Convert dates to epoch / 1000
    //
    start_date = Math.floor(new Date(start_date).getTime() / 1000);
    stop_date = Math.floor(new Date(stop_date).getTime() / 1000);
 

    //
    // Step 2: Spit out our data URL for the given time frame
    //
 
    return `https://www.tadpoles.com/remote/v1/events?direction=range&earliest_event_time=${start_date}&latest_event_time=${stop_date}&num_events=300&client=dashboard`;
}


//
//
// This is more of a public-ish function
// Where it uses the previously defined function to
// build a URL and send a request to the server to get a listing of picutes, etc
// for a given date range
//
//
function get_data(start_date, end_date){
    
    //
    // Return the promise that fetch returns...
    //
    return async function get_data(){
        
        //
        // Use previously defined url_maker function to generate the url we're going to use
        // to pull out our data JSON
        //
        let url = url_maker(start_date, end_date);
        

        //
        //
        //
        return fetch(url)
            .then(function(response){
                var json = response.json();
                console.log(json);
                return json;
            });
    }
}


//
//
// Cheat function to download whatever
// by creating an 'a' tag, and clicking it
//
// K
// I
// S
// S
//
//
async function get_media(key, attachment){
    
    let url = `https://www.tadpoles.com/remote/v1/obj_attachment?obj=${key}&key=${attachment}&download=true`;

    var link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "WHOA");
    link.click();
    
    return new Promise((res, rej) => {res(true)})

}

// /////////////////////////////////////////////////////////////////////////////////////
// -------------------------------------------------------------------------------------
//
//
//
//
// MAIN FUNCTION:
//
//
//
//
// /////////////////////////////////////////////////////////////////////////////////////
// -------------------------------------------------------------------------------------
function main(){
    
    //
    // STEP 1.) Build an array of dates to scrape from starting 1/1/12 in 10 day increments.
    // --------------------------------------------------------------------------------------
    //          This *should* capture any activity for all children currently enrolled in Primrose...(should)
    //
    //
    var dates = [];
    
    var date_now = new Date();
    
    //
    // 2020-11-06 Addition:
    // Popular request, make it so the user can customize their start date
    //
    //
    var date_seed = "";
    
    //
    // Loop until the user provides a valid(ish) date
    //
    while(!/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(date_seed)){
        date_seed = prompt("START DATE","2012-01-01");
    }
    
    var date_seed = new Date(date_seed);
    var date_next = new Date(Math.min(date_now, new Date(date_seed.getFullYear(), date_seed.getMonth(), date_seed.getDate() + 10), date_now));
        

    // Fill out the array of dates
    // with *now* being the upper limit / stopping condition
    while(date_seed < date_now){
        
        dates.push([date_seed, date_next]);
        date_seed = date_next;
        date_next = new Date(Math.min(date_now, new Date(date_seed.getFullYear(), date_seed.getMonth(), date_seed.getDate() + 10), date_now));
        
    }
    
    // 
    // STEP 2.) RUN A LOOP TO GET DATA FROM THE SERVER AND STORE IT SOMEWHERE
    // --------------------------------------------------------------------------
    // Synchronous function to get data from the server
    // and store it in our global 'all_events' array for use
    // later
    //
    async function data_getter(){
        
        //
        // Loop and pull all event data
        // out of the tadpoles servers
        //
        for (const [idx, _date] of dates.entries()) {

            //
            // This is what was returned (assuming no errors)
            //
            const data = await get_data(dates[idx][0],dates[idx][1])();
            
            //
            // Let the user know where we are...
            // and how many results were returned...
            //
            var para = document.createElement("p");
            para.innerText = new Date(_date[0]).toDateString() + " : " + data.events.length + " records";
            document.querySelector("#status").prepend(para);
            
            //
            // Store the data
            //
            document.all_events = document.all_events.concat(data.events);

        }

        return new Promise((res, rej) => {res(true)})

    }
    
    
    
    
    // 
    // STEP 3.) DUMP ALL OF OUR DATA ONTO THE USER'S SYSTEM FOR POSTERITY
    // --------------------------------------------------------------------------
    // Synchronous function to get data from the server
    // and store it in our global 'all_events' array for use
    // later
    //
    async function data_dump(){
        //
        // and store the data as a JSON on the user's system, for fun...
        //
        var blob = new Blob([JSON.stringify(document.all_events,null,"\t")], {"type": "text/json;charset=utf8;"});
        var link;
        
        link = document.createElement("a");
        link.setAttribute("href", window.URL.createObjectURL(blob));
        link.setAttribute("download", "primrose.json");
        link.click();
        
        return new Promise((res, rej) => {res(true)})
        
    }
    
    
    
    
    
    // 
    // STEP 4.) FIND EVENTS WITH MEDIA AND DOWNLOAD THEM...
    // --------------------------------------------------------------------------
    // Tadpoles has a pretty useful pattern for downloading stuff. We'll create a 
    // fake link, force the browser to click it, then wait for 3 seconds to download
    // all events with attachments
    //
    async function media_getter(){
        //
        // Keep users in the loop about what's going on...
        //
        document.querySelector("#notification").innerHTML = "DOWNLOADING MEDIA..."
        //
        // In the 'all_events' array, look for objects where the attachment attr is not empty
        //
        document.all_media = document.all_events.filter(function(x){return x.attachments.length > 0});
        
        
        //
        // Loop and click synthetic links
        // to download media...
        //
        for (const [idx, media] of document.all_media.entries()) {

            //
            // Build / Click link
            //
            const data = await get_media(media.key, media.attachments[0]);
            
            //
            // Wait for 3 seconds
            //
            await new Promise((resolve) => setTimeout(resolve,3000));
            
            //
            // Let the user know where we are...
            // and how many results were returned...
            //
            var paragraph = document.createElement("p");
            paragraph.innerText = `DOWNLOADING: ${idx} of ${document.all_media.length} - (${new Date(media.event_date).toString()})`;
            document.querySelector("#status").prepend(paragraph);


        }
        
        document.querySelector("body").innerHTML = "<h1>DONE!</h1>"
        
        return new Promise((res, rej) => {res(true)});
        
    }


    
    data_getter()
    .then(data_dump)
    .then(media_getter);
}




//
//
//
//
//
// FIRE OFF MAIN FUNCTION
//
document.querySelector("body").innerHTML = `
    <div style="margin-top:10px"></div>
    
    <div style="position:relative;display: inline-block; min-height:79px;width: 888px; padding: 15px 30px 15px 20px;margin-bottom:10px;" class="hide">
        <h1 class="pull-left" style="padding-top:15px;font-size:75px;color:grey;" data-bind="text: 'tadpoles'">tadpoles excavator</h1>
        <p class="pull-left" style="padding-left: 50px; padding-top:15px;font-size:15px;color:grey;margin-top: 25px;">(Questions, Comments, Concerns? Feel Free to Contact me:: Justin.W.Wolcott@gmail.com)</p>
    </div>
    
    
    <div class="row">
       <div class="container" style="background: white; border-radius: 10px; border:0; min-height:111px; position:relative;padding: 15px 20px; width:758px;">
            <div class='col-md-12'>
                <h1 id="notification" style='text-align:center; margin-bottom: 25px;'>COLLECTING TADPOLES EVENTS...</h1>
            </div>
            
            <div class='col-md-12' id='status'>
            </div>
       </div>
    </div>`;

main();
