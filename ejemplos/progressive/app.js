$(function () {
  var $container = $('#js-table')

  $.getJSON('https://jsonplaceholder.typicode.com/users')
    .then(function (users) {
      users.forEach(function (user) {
        var template = '<tr><td>' + user.id +'</td><td>' + user.name +'</td><td>' + user.email +'</td></tr>'

        var element = $(template)
        $container.append(element)
      })
    })
})
