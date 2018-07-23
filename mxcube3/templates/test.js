const dust = require('dustjs-linkedin');
const fetch = require('isomorphic-fetch');
const EXITemplates = require('./precompiled.templates.min.js');


function assemble_result(data) {
  var html = "";

  for (var i = 0; i < data.items.length; i = i + 1) {
    dust.render("workflowmainview.template", data.items[i], function (error, output) {
      html = html + output;
    });
  }

  console.log(html);
}



function get_result() {

  const url = 'https://ispyb.esrf.fr/ispyb/ispyb-ws/rest/0fcd5ce7a71520a4bb6ef068543fe0c450744d8a/proposal/MX415/mx/workflow/step/345358/result';

  fetch(url, {
    method: 'GET',
    credentials: 'include'
  }).then(response => {
    if (response.status >= 400) {
    }
    return response.json();
  }).then(response => {
    assemble_result(response);
  });

};

get_result();
