$(document).ready(function() {
    $("h2, h3, h4").not('.not-toc').each(function(i) {
        var current = $(this);
        current.attr("id", "heading-" + i);
        var indent = ''
        if (current[0].nodeName == 'H3') indent = '&nbsp;&nbsp;&nbsp;&nbsp;'
        if (current[0].nodeName == 'H4') indent = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        $("#toc").append(indent + "<a id='link" + i + "' href='#heading-" +
            i + "' title='" + current.html() + "'>" + 
            current.html() + "</a><br/>")
        current.append(' <a href="#top" class="top">▲</a>')
    });
    $('#toc').append('<div class="collapse-toggle">↕ table of contents</div>')
    $("#toc").before('<h2><a name="top"></a>Contents</h2>')
    
    var sticky            = $('#toc')
    var originalOffsetY   = sticky.offset().top
    var originalTocHeight = sticky.height()
    var tocCollapseHeight = 10;
    
    var makeTocFixed = function() {
        sticky.addClass('fixed')
        sticky.find('.collapse-toggle').css('display', 'inline')
        collapseToc()
    }
    var unfixToc = function() {
        sticky.removeClass('fixed')
            .removeClass('collapse')
        sticky.find('.collapse-toggle').css('display', 'none')
        expandToc()
    }
    
    $('#toc.collapse').mouseover(function() {
        console.log('mouseover')
        collapseToggle()
    })
    
    $('#toc.collapse').mouseout('mouseover', function() {
        console.log('mouseout')
        collapseToggle()
    })
    
    var expandToc = function() {
        sticky.removeClass('collapse')
        sticky.css('height', originalTocHeight)
    }
    
    var collapseToc = function() {
        sticky.addClass('collapse')
        sticky.css('height', tocCollapseHeight + 'px')
    }
    
    var collapseToggle = function(collapse) {
        console.log(sticky.hasClass('collapse'))
        if (true == sticky.hasClass('collapse'))
            expandToc()
        else 
            collapseToc()
    }
    
    $('.collapse-toggle').click(function() {
        collapseToggle()
    })
    
    document.addEventListener('scroll', function(e) {
        window.scrollY >= originalOffsetY ? makeTocFixed() : unfixToc()
    });
})