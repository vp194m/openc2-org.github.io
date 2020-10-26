!(function ($) {
  "use strict";

  $(document).ready(function () {
    getRepositories(1);
  });

})(jQuery);

/**
 * @param  {String} pageNumber
 * @return {void} Sets HTML to render cards in the specifications page.
 */
function getRepositories(pageNumber) {
  var html = "";
  $.ajax({
    url: "https://api.github.com/search/repositories?q=openc2+in:name+org:oasis-tcs",
    method: "GET",
    async: true,
    data: {
      per_page: 5,
      page: pageNumber
    },
    dataType: "json",
    success: function (data, status, response) {
      if (data.items !== undefined && data.items.length > 0) {
        for (var i = 0; i < data.items.length; i++) {
          html += '<div class="card w-100 mb-4">' +
            '<div class="card-body">' +
            '<h5 class="card-title">' +
            '<a href="https://github.com/' + data.items[i].full_name + '" target="_blank">' + data.items[i].name + '</a>' +
            '</h5>' +
            '<div class="text-gray mt-2" style="font-size:14px">';
          if (data.items[i].language != null) {
            html += '<span class="mr-3"><span class="repo-language-color" style="background-color: #3572A5"></span><span>' + data.items[i].language + '</span></span>';
          }
          html += '<a href="https://github.com/' + data.items[i].full_name + '/network/members" class="muted-link mr-3" target="_blank"><em class="bx bx-git-repo-forked"></em> ' + data.items[i].forks_count + ' </a>' +
            '<a href="https://github.com/' + data.items[i].full_name + '/stargazers" class="no-wrap muted-link mr-3" target="_blank"><em class="bx bx-star"></em> ' + data.items[i].stargazers_count + ' </a>' +
            '<a href="https://github.com/' + data.items[i].full_name + '/issues" class="no-wrap muted-link mr-3" target="_blank"><em class="bx bx-error-circle"></em> ' + data.items[i].open_issues + ' </a>' +
            '<a href="javascript:void(0);" onclick="showDetails(\'' + data.items[i].name + '\',\'' + data.items[i].full_name + '\');" class="no-wrap muted-link mr-3"><em class="bx bx-detail"></em> More Details</a>' +
            '</div>' +
            '</div>' +
            '</div>';
        }
        var linkHeader = response.getResponseHeader('Link');
        if (linkHeader != null) {
          var linkHeaderObj = linkHeaderParser(linkHeader);
          var from = 5 * pageNumber - 5 + 1;
          var to = 5 * pageNumber;
          html += '<div class="mb-4">';
          html += 'Displaying ' + from + ' - ' + to + ' of ' + data.total_count + ' Repositories';
          if (linkHeaderObj.prev != null) {
            html += '<button type="button" class="btn btn-green btn-md" onclick="getRepositories(' + linkHeaderObj.prev + ')">Previous Page</button>';
          }
          if (linkHeaderObj.next != null) {
            html += '&nbsp;<button type="button" class="btn btn-green btn-md" onclick="getRepositories(' + linkHeaderObj.next + ')">Next Page</button>';
          }
          html += '</div>';
        }
        $("#specs-cards").html(html);
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR);
      console.log(textStatus);
      console.log(errorThrown);
      $("#specs-cards").html('An error occurred while retrieving more information. Please try again later.');
    }
  });
}

/**
 * @param  {String} linkStr String from API's response in 'Link' field
 * @return {Object}
 */
function linkHeaderParser(linkStr) {
  return linkStr.split(',').map(function (rel) {
    return rel.split(';').map(function (curr, idx) {
      if (idx === 0) return /[^_]page=(\d+)/.exec(curr)[1];
      if (idx === 1) return /rel="(.+)"/.exec(curr)[1];
    })
  }).reduce(function (obj, curr, i) {
    obj[curr[1]] = curr[0];
    return obj;
  }, {});
}

/**
 * @param  {String} repoName - Repo Name
 * @param  {String} repoFullName - Full repo name including organization
 * @return {void} Sets the HTML for the body in the modal dialog.
 */
function showDetails(repoName, repoFullName) {
  var releaseInfo = "";
  var mymodal = $('#specsModalCenter');
  mymodal.find('.modal-title').text(repoName);
  mymodal.find('.modal-body').text('');
  mymodal.modal('show');

  $.ajax({
    url: "https://api.github.com/repos/" + repoFullName + "/releases/latest",
    method: "GET",
    async: false,
    dataType: "json",
    success: function (data, status, response) {
      if (data != null) {
        const d = new Date(data.created_at);
        releaseInfo = '<h5>Latest Tagged Release</h5>';
        releaseInfo += '<h6><a href="' + data.html_url + '" target="_blank">Release created </a> on ' + d.toDateString() + '</h6>';
        releaseInfo += '<h6><a href="https://github.com/' + repoFullName + '/tree/' + data.tag_name + '" target="_blank">View Tag Details</a></h6>';
        mymodal.find('.modal-body').append(releaseInfo + '<br>');
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {

    }
  });

  $.ajax({
    url: "https://api.github.com/repos/" + repoFullName + "/commits/working",
    method: "GET",
    async: false,
    dataType: "json",
    success: function (data, status, response) {
      if (data != null) {
        const d = new Date(data.commit.author.date);
        releaseInfo = '<h5>Latest Commit to "working" branch</h5>';
        releaseInfo += '<h6><a href="' + data.html_url + '" target="_blank">Commit created</a> by ' + data.commit.author.name + ' on ' + d.toDateString() + '</h6>';
        mymodal.find('.modal-body').append(releaseInfo + '<br>');
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {

    }
  });

  $.ajax({
    url: "https://api.github.com/repos/" + repoFullName + "/pulls?state=open&per_page=5",
    method: "GET",
    async: false,
    dataType: "json",
    success: function (data, status, response) {
      if (data !== undefined && data.length > 0) {
        var prCount = data.length;
        var linkHeader = response.getResponseHeader('Link');
        if (linkHeader != null) {
          prCount = "More than " + prCount;
        }
        releaseInfo = '<h5>Pull Requests</h5>';
        releaseInfo += '<span style="font-size:14px;"><a href="https://github.com/' + repoFullName + '/pulls" target="_blank">' + prCount + ' Open Pull Request(s)</a> found.</span><br>';
        mymodal.find('.modal-body').append(releaseInfo + '<br>');
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {

    }
  });

  $.ajax({
    url: "https://api.github.com/search/issues?q=repo:" + repoFullName + "+is:pr+is:merged&sort=merged&per_page=5",
    method: "GET",
    async: false,
    dataType: "json",
    success: function (data, status, response) {
      if (data.items !== undefined && data.items.length > 0) {
        releaseInfo = '<h5>Recently Merged PRs</h5>';
        for (var i = 0; i < data.items.length; i++) {
          const createdDate = new Date(data.items[i].created_at);
          const closedDate = new Date(data.items[i].closed_at);
          releaseInfo += '<span style="font-size:14px;"><a href="' + data.items[i].html_url + '" target="_blank">' + data.items[i].title + '</a></span><br>';
          releaseInfo += '<span style="font-size:12px;"> Created on ' + createdDate.toDateString() + ' and Merged on ' + closedDate.toDateString() + '</span><br>';
        }
        mymodal.find('.modal-body').append(releaseInfo + '<br>');
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {

    }
  });
}