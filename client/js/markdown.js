// if (typeof markdown === 'undefined') 
// ;
markdown = {
    parse: function (s) {
        var r = s, ii, pre1 = [], pre2 = [];

        //philosophical blockquotes for nerds
        //not working, who cares
        // r = r.replace(/>(.*)/gm, '<blockquote>$1</blockquote>');

        // h1 - h6 and hr
        r = r.replace(/^######(.*)/gm, '<h6>$1</h6>');
        r = r.replace(/^#####(.*)/gm, '<h5>$1</h5>');
        r = r.replace(/^####(.*)/gm, '<h4>$1</h4>');
        r = r.replace(/^###(.*)/gm, '<h3>$1</h3>');
        r = r.replace(/^##(.*)/gm, '<h2>$1</h2>');
        r = r.replace(/^#(.*)/gm, '<h1>$1</h1>');
        r = r.replace(/^[-*][-*][-*]+/gm, '<hr>');
        
        // bold
        r = r.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        r = r.replace(/__(.*?)__/g, '<strong>$1</strong>');
        //italics
        r = r.replace(/\*(.*?)\*/g, '<em>$1</em>');
        r = r.replace(/_(.*?)_/g, '<em>$1</em>');
        //strike through
        r = r.replace(/~~(.*?)~~/g, '<strike>$1</strike>');
        // r = r.replace(new RegExp('//(((?!https?://).)*?)//', 'g'), '<em>$1</em>');
        r = r.replace(/``(.*?)``/gm, '<code>$1</code>');
        
        // unordered lists with 
        r = r.replace(/^\+(.*)/gm, '<ul><li>$1</li></ul>');
        r = r.replace(/^\-(.*)/gm, '<ul><li>$1</li></ul>');
        r = r.replace(/^\*(.*)/gm, '<ul><li>$1</li></ul>');


        // restore the preformatted and unformatted blocks
        r = r.replace(new RegExp('<pre></pre>', 'g'), function (match) { return '<pre>' + pre2.shift() + '</pre>'; });
        r = r.replace(/{{{}}}/g, function (match) { return pre1.shift(); });
        return r;
    }
};

//thx bro http://pzxc.com/simple-javascript-markdown-parsing-function