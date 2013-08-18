// if (typeof markdown === 'undefined') 
// ;
markdown = {
    parse: function (s) {
        var r = s, ii, pre1 = [], pre2 = [];

        // detect newline format
        var newline = r.indexOf('\r\n') != -1 ? '\r\n' : r.indexOf('\n') != -1 ? '\n' : ''
        
        // store {{{ unformatted blocks }}} and <pre> pre-formatted blocks </pre>
        r = r.replace(/{{{([\s\S]*?)}}}/g, function (x) { pre1.push(x.substring(3, x.length - 3)); return '{{{}}}'; });
        r = r.replace(new RegExp('<pre>([\\s\\S]*?)</pre>', 'gi'), function (x) { pre2.push(x.substring(5, x.length - 6)); return '<pre></pre>'; });
        
        // h1 - h4 and hr
        r = r.replace(/^====== (.*)=*/gm, '<h6>$1</h6>');
        r = r.replace(/^===== (.*)=*/gm, '<h5>$1</h5>');
        r = r.replace(/^==== (.*)=*/gm, '<h4>$1</h4>');
        r = r.replace(/^=== (.*)=*/gm, '<h3>$1</h3>');
        r = r.replace(/^== (.*)=*/gm, '<h2>$1</h2>');
        r = r.replace(/^= (.*)=*/gm, '<h1>$1</h1>');
        r = r.replace(/^[-*][-*][-*]+/gm, '<hr>');
        
        // bold, italics, and code formatting
        r = r.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        r = r.replace(new RegExp('//(((?!https?://).)*?)//', 'g'), '<em>$1</em>');
        r = r.replace(/``(.*?)``/g, '<code>$1</code>');
        
        // unordered lists
        r = r.replace(/^\*\*\*\* (.*)/gm, '<ul><ul><ul><ul><li>$1</li></ul></ul></ul></ul>');
        r = r.replace(/^\*\*\* (.*)/gm, '<ul><ul><ul><li>$1</li></ul></ul></ul>');
        r = r.replace(/^\*\* (.*)/gm, '<ul><ul><li>$1</li></ul></ul>');
        r = r.replace(/^\* (.*)/gm, '<ul><li>$1</li></ul>');
        for (ii = 0; ii < 3; ii++) r = r.replace(new RegExp('</ul>' + newline + '<ul>', 'g'), newline);
        
        // ordered lists
        r = r.replace(/^#### (.*)/gm, '<ol><ol><ol><ol><li>$1</li></ol></ol></ol></ol>');
        r = r.replace(/^### (.*)/gm, '<ol><ol><ol><li>$1</li></ol></ol></ol>');
        r = r.replace(/^## (.*)/gm, '<ol><ol><li>$1</li></ol></ol>');
        r = r.replace(/^# (.*)/gm, '<ol><li>$1</li></ol>');
        for (ii = 0; ii < 3; ii++) r = r.replace(new RegExp('</ol>' + newline + '<ol>', 'g'), newline);
        
        // links
        r = r.replace(/\[\[(http:[^\]|]*?)\]\]/g, '<a target="_blank" href="$1">$1</a>');
        r = r.replace(/\[\[(http:[^|]*?)\|(.*?)\]\]/g, '<a target="_blank" href="$1">$2</a>');
        r = r.replace(/\[\[([^\]|]*?)\]\]/g, '<a href="$1">$1</a>');
        r = r.replace(/\[\[([^|]*?)\|(.*?)\]\]/g, '<a href="$1">$2</a>');
        
        // images
        r = r.replace(/{{([^\]|]*?)}}/g, '<img src="$1">');
        r = r.replace(/{{([^|]*?)\|(.*?)}}/g, '<img src="$1" alt="$2">');
        
        // video
        r = r.replace(/<<(.*?)>>/g, '<embed class="video" src="$1" allowfullscreen="true" allowscriptaccess="never" type="application/x-shockwave/flash"></embed>');
        
        // hard linebreak if there are 2 or more spaces at the end of a line
        r = r.replace(new RegExp(' + ' + newline, 'g'), '<br>' + newline);
        
        // split on double-newlines, then add paragraph tags when the first tag isn't a block level element
        if (newline != '') for (var p = r.split(newline + newline), i = 0; i < p.length; i++) {
            var blockLevel = false;
            if (p[i].length >= 1 && p[i].charAt(0) == '<') {
                // check if the first tag is a block-level element
                var firstSpace = p[i].indexOf(' '), firstCloseTag = p[i].indexOf('>');
                var endIndex = firstSpace > -1 && firstCloseTag > -1 ? Math.min(firstSpace, firstCloseTag) : firstSpace > -1 ? firstSpace : firstCloseTag;
                var tag = p[i].substring(1, endIndex).toLowerCase();
                for (var j = 0; j < blockLevelElements.length; j++) if (blockLevelElements[j] == tag) blockLevel = true;
            } else if (p[i].length >= 1 && p[i].charAt(0) == '|') {
                // format the paragraph as a table
                blockLevel = true;
                p[i] = p[i].replace(/ \|= /g, '</th><th>').replace(/\|= /g, '<tr><th>').replace(/ \|=/g, '</th></tr>');
                p[i] = p[i].replace(/ \| /g, '</td><td>').replace(/\| /g, '<tr><td>').replace(/ \|/g, '</td></tr>');
                p[i] = '<table>' + p[i] + '</table>';
            } else if (p[i].length >= 2 && p[i].charAt(0) == '>' && p[i].charAt(1) == ' ') {
                // format the paragraph as a blockquote
                blockLevel = true;
                p[i] = '<blockquote>' + p[i].replace(/^> /gm, '') + '</blockquote>';
            }
            if (!blockLevel) p[i] = '<p>' + p[i] + '</p>';
        }
        
        // reassemble the paragraphs
        if (newline != '') r = p.join(newline + newline);
        
        // restore the preformatted and unformatted blocks
        r = r.replace(new RegExp('<pre></pre>', 'g'), function (match) { return '<pre>' + pre2.shift() + '</pre>'; });
        r = r.replace(/{{{}}}/g, function (match) { return pre1.shift(); });
        return r;
    }
};