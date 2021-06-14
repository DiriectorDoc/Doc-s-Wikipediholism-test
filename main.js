$(async function(){
	let content = ($("#status").html("Fetching questions"),await $.getJSON("https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&titles=Wikipedia%3AWikipediholism_test&formatversion=2&rvprop=content&rvslots=*&origin=*")).query.pages[0].revisions[0].slots.main.content.split(/==[\w\s]+==/g),
		articles = ($("#status").html("Loading Wikipedia statistics"),await $.getJSON("https://en.wikipedia.org/w/api.php?action=query&format=json&meta=siteinfo&formatversion=2&siprop=statistics&origin=*")).query.statistics.articles,
		revision = ($("#status").html("Establishing latest revision"),await $.getJSON("https://en.wikipedia.org/w/rest.php/v1/page/Wikipedia:Wikipediholism%20test/history")).revisions[0].id,

		lines = content[1].split("\n#"),
		p = -1,
		questions = [],

		wikiParse = (str) => {
			let nowikis = str.match(/<nowiki>(((?!<\/nowiki>).)*)<\/nowiki>/g) || [];
			str = str
				.replaceAll(/(^|[^'])'([^']|$)/gi, "$1&#39;$2")
				.replaceAll(/\[\[(.+)\]\](s)/gi, "[[$1|$1$2]]")
				.replaceAll(/\[(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*))\s(.*)\]/gi, '<a href="$1">$4</a>')
				.replaceAll(/''([^']+)''/gi, '<i>$1</i>')
				.replaceAll(/'''([^']+)'''/gi, '<strong>$1</strong>')
				.replaceAll(/\[\[([^|\[\]]+)\|([^|\[\]]+)\]\]/gi, '<a href="https://en.wikipedia.org/wiki/$1">$2</a>')
				.replaceAll(/\[\[([^|\[\]]+)\]\]/gi, '<a href="https://en.wikipedia.org/wiki/$1">$1</a>')
				.replaceAll(/\{\{NUMBEROFARTICLES\}\}/g, articles)
				.replaceAll(/{{[sS]miley\s*\|\s*desc\s*=\s*(.+)}}/g, '<abbr title="$1" style="border-bottom: none;"><img alt="Face-smile.svg" src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Face-smile.svg/18px-Face-smile.svg.png" decoding="async" width="18" height="18" srcset="https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Face-smile.svg/27px-Face-smile.svg.png 1.5x, https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Face-smile.svg/36px-Face-smile.svg.png 2x" data-file-width="48" data-file-height="48" style="cursor: help;border: 0;vertical-align: middle;"></abbr>')
			for(let e of nowikis){
				str = str.replace(/<nowiki>.*<\/nowiki>/g, e.replace(/<nowiki>(.*)<\/nowiki>/g, "$1").replaceAll(/\$/g, "$$$$"))
			}
			return str
		};

	scores = [];

	$(".revision").html(revision)
	$('a[href="{{revision}}"]').attr("href", "https://en.wikipedia.org/w/index.php?title=Wikipedia:Wikipediholism_test&oldid="+revision)
	$("#status").html("Parsing data")
	for(let e of content[2].match(/\|\s?[0-9\-]+(\s?[-–—]\s?[0-9\-]+|[\w\s]+)\s?\|\|\s?.+/g)){
		let score = /^\|\s?([0-9\-]+)(\s?[-–—]\s?([0-9\-]+)|[\w\s]+)\s?\|\|\s?(.+)$/g.exec(e);

		scores.push(!scores[0] ? {
			lower: -Infinity,
			upper: +score[1],
			diagnosis: wikiParse(score[4])
		} : {
			lower: +score[1],
			upper: +score[3] || Infinity,
			diagnosis: wikiParse(score[4])
		})
	}
	if(/^\n.*($|\n)/g.test(lines[0])){
		lines.shift()
	}
	for(let e of lines){
		let per = /\((-?(\d*\.\d+|\d+)\s?(per|(for\s)?(every|each))).*\)$/gi.test(e = e.replaceAll(/\n/g, ""));
		e = {
			input: /\(.*(add|every).*\)/g.test(e) || per,
			value: +/\(([0-9.-]+).*\)$/g.exec(e)[1],
			text: wikiParse(e.replaceAll(/\s\([^\(]+\)$/g, "")),
			increment: per,
			element: $("<tr>")
		};
		if (/^\*+/g.test(e.text)) {
			e.text = e.text.replaceAll(/^\*+/g, "");
			questions[p].push(e)
		} else {
			questions[++p] = [e]
		}
		e.element.html(`<td class="check"><input type="checkbox" ${e.increment ? "disabled" : ""} onchange='let total=+$(".total:last").html()+$(this).attr("point-value")*(2*$(this).is(":checked")-1);$(".total").html(total);for(let t of scores)if(total>=t.lower&&total<=t.upper){$("#diagnosis").html(t.diagnosis);break}' point-value=${e.value} /></td><td class="question">${e.text}</td><td class="field">${e.input ? `<input type="text" onchange='let e=+$(this).val()||0;$(".total").html(+$(".total:last").html()-+$(this).attr("previous-input")+($(this).attr("previous-input",e),e))' previous-input="0" />` : ""}</td>`)
	}
	$("#status").remove()


	p = 0;
	$("#test tbody").empty();
	for(let e of questions[p]){
		$("#test tbody").append(e.element)
	}

	$(".switch").click(function(){
		$("body")[$(".switch input").is(":checked")?"removeClass":"addClass"]("dark")
		$(".github")[$(".switch input").is(":checked")?"removeClass":"addClass"]("white")
	})

	function fillPage(){
		if(p < 0){
			p=0
		} else if(p >= questions.length){
			p=questions.length-1
		} else {
			$("#test tbody").empty();
			for(let e of questions[p]){
				$("#test tbody").append(e.element)
			}
		}
	}

	$("button.next,button.prev").prop("disabled", false)
	$("button.prev").click(function(){
		p--;
		fillPage()
	})
	$("button.next").click(function(){
		p++;
		fillPage()
	})
})