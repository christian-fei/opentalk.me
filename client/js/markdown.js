markdown = {
    parse: function (s) {
        var r = s, ii, pre1 = [], pre2 = [];



        r = r.trim();
        r = r.replace(/\n/g,' <br> ');

        if( r.match(/(^|\s)``/gm) ){
            // console.log('is code')
            r = r.replace(/(^|\s)``(.*?)``/gm, ' <pre><code>$2</code></pre> ');
        }else{
            // console.log('ain\'t code');
            var imagePattern = /(^|\s)(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?\.(?:png|jpg|jpeg|gif|bmp|svg))/gm;
            r = r.replace(imagePattern, " <div class='message-image-wrapper'><a href='$2' title='open in a new page' class='open-in-new-tab' target='_blank'></a><img src='$2' class='message-image'/></div>  ");
            var urlPatternWithProtocol = /(^|\s)(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gm;
            r = r.replace(urlPatternWithProtocol, "  <a href='$2' rel='noindex,nofollow' target='_blank'>$2</a>  ");
            var urlPatternWithoutProtocol = /(^|\s)([\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gm;
            r = r.replace(urlPatternWithoutProtocol, "  <a href='http://$2' rel='noindex,nofollow' target='_blank'>$2</a>  ");

            //philosophical blockquotes for nerds
            //not working, who cares
            // r = r.replace(/>(.*)/gm, '<blockquote>$1</blockquote>');

            // h1 - h6 and hr
            // \A :Matches at the start of the string the regex pattern is applied to. Matches a position rather than a character. Never matches after line breaks.
            r = r.replace(/(^|\A)######(.*)/gm, '<h6>$2</h6>');
            r = r.replace(/(^|\A)#####(.*)/gm, '<h5>$2</h5>');
            r = r.replace(/(^|\A)####(.*)/gm, '<h4>$2</h4>');
            r = r.replace(/(^|\A)###(.*)/gm, '<h3>$2</h3>');
            r = r.replace(/(^|\A)##(.*)/gm, '<h2>$2</h2>');
            r = r.replace(/(^|\A)#(.*)/gm, '<h1>$2</h1>');
            r = r.replace(/(^|\s)[-*][-*][-*]+/gm, '<hr>');
            
            // bold
            r = r.replace(/(^|\s)\*\*(.*?)\*\*/g, ' <strong>$2</strong> ');
            r = r.replace(/(^|\s)__(.*?)__/g, ' <strong>$2</strong> ');
            //italics
            r = r.replace(/(^|\s)\*(.*?)\*/g, ' <em>$2</em> ');
            r = r.replace(/(^|\s)_(.*?)_/g, ' <em>$2</em> ');
            //strike through
            r = r.replace(/(^|\s)~~(.*?)~~/g, ' <strike>$2</strike> ');
            
            // unordered lists with 
            r = r.replace(/^\+(.*)/gm, ' <ul><li>$1</li></ul> ');
            r = r.replace(/^\-(.*)/gm, ' <ul><li>$1</li></ul> ');
            r = r.replace(/^\*(.*)/gm, ' <ul><li>$1</li></ul> ');

            //@usernames
            r = r.replace(/^@(.\S+)/gm, ' <span class="at-username">@$1</span> ');
            
        }




        // restore the preformatted and unformatted blocks
        r = r.replace(new RegExp('<pre></pre>', 'g'), function (match) { return '<pre>' + pre2.shift() + '</pre>'; });
        r = r.replace(/{{{}}}/g, function (match) { return pre1.shift(); });
        return r;
    }
};

//thx bro http://pzxc.com/simple-javascript-markdown-parsing-function