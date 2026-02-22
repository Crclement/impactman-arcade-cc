mergeInto(LibraryManager.library, {
  SendWebMessage: function (message) {
    let data = UTF8ToString(message)

    window.OnWebMessage(data)
  }
});