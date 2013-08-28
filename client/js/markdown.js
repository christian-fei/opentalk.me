markdown = {
    parse: function (s) {
        var r = s, ii, pre1 = [], pre2 = [];

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
        r = r.replace(/\*\*(.*?)\*\*/g, ' <strong>$1</strong> ');
        r = r.replace(/__(.*?)__/g, ' <strong>$1</strong> ');
        //italics
        r = r.replace(/\*(.*?)\*/g, ' <em>$1</em> ');
        r = r.replace(/(^|\s)_(.*?)_/g, ' <em>$2</em> ');
        //strike through
        r = r.replace(/~~(.*?)~~/g, ' <strike>$1</strike> ');
        // r = r.replace(new RegExp('//(((?!https?://).)*?)//', 'g'), '<em>$1</em>');
        r = r.replace(/``(.*?)``/gm, ' <code>$1</code> ');
        
        // unordered lists with 
        r = r.replace(/^\+(.*)/gm, ' <ul><li>$1</li></ul> ');
        r = r.replace(/^\-(.*)/gm, ' <ul><li>$1</li></ul> ');
        r = r.replace(/^\*(.*)/gm, ' <ul><li>$1</li></ul> ');


        // restore the preformatted and unformatted blocks
        r = r.replace(new RegExp('<pre></pre>', 'g'), function (match) { return '<pre>' + pre2.shift() + '</pre>'; });
        r = r.replace(/{{{}}}/g, function (match) { return pre1.shift(); });
        return r;
    }
};

//thx bro http://pzxc.com/simple-javascript-markdown-parsing-function