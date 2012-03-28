var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____84718 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____84718)) {
    return or__3548__auto____84718
  }else {
    var or__3548__auto____84719 = p["_"];
    if(cljs.core.truth_(or__3548__auto____84719)) {
      return or__3548__auto____84719
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__84783 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84720 = this$;
      if(cljs.core.truth_(and__3546__auto____84720)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84720
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____84721 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84721)) {
          return or__3548__auto____84721
        }else {
          var or__3548__auto____84722 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84722)) {
            return or__3548__auto____84722
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__84784 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84723 = this$;
      if(cljs.core.truth_(and__3546__auto____84723)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84723
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____84724 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84724)) {
          return or__3548__auto____84724
        }else {
          var or__3548__auto____84725 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84725)) {
            return or__3548__auto____84725
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__84785 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84726 = this$;
      if(cljs.core.truth_(and__3546__auto____84726)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84726
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____84727 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84727)) {
          return or__3548__auto____84727
        }else {
          var or__3548__auto____84728 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84728)) {
            return or__3548__auto____84728
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__84786 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84729 = this$;
      if(cljs.core.truth_(and__3546__auto____84729)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84729
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____84730 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84730)) {
          return or__3548__auto____84730
        }else {
          var or__3548__auto____84731 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84731)) {
            return or__3548__auto____84731
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__84787 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84732 = this$;
      if(cljs.core.truth_(and__3546__auto____84732)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84732
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____84733 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84733)) {
          return or__3548__auto____84733
        }else {
          var or__3548__auto____84734 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84734)) {
            return or__3548__auto____84734
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__84788 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84735 = this$;
      if(cljs.core.truth_(and__3546__auto____84735)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84735
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____84736 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84736)) {
          return or__3548__auto____84736
        }else {
          var or__3548__auto____84737 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84737)) {
            return or__3548__auto____84737
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__84789 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84738 = this$;
      if(cljs.core.truth_(and__3546__auto____84738)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84738
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____84739 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84739)) {
          return or__3548__auto____84739
        }else {
          var or__3548__auto____84740 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84740)) {
            return or__3548__auto____84740
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__84790 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84741 = this$;
      if(cljs.core.truth_(and__3546__auto____84741)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84741
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____84742 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84742)) {
          return or__3548__auto____84742
        }else {
          var or__3548__auto____84743 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84743)) {
            return or__3548__auto____84743
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__84791 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84744 = this$;
      if(cljs.core.truth_(and__3546__auto____84744)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84744
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____84745 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84745)) {
          return or__3548__auto____84745
        }else {
          var or__3548__auto____84746 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84746)) {
            return or__3548__auto____84746
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__84792 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84747 = this$;
      if(cljs.core.truth_(and__3546__auto____84747)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84747
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____84748 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84748)) {
          return or__3548__auto____84748
        }else {
          var or__3548__auto____84749 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84749)) {
            return or__3548__auto____84749
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__84793 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84750 = this$;
      if(cljs.core.truth_(and__3546__auto____84750)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84750
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____84751 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84751)) {
          return or__3548__auto____84751
        }else {
          var or__3548__auto____84752 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84752)) {
            return or__3548__auto____84752
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__84794 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84753 = this$;
      if(cljs.core.truth_(and__3546__auto____84753)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84753
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____84754 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84754)) {
          return or__3548__auto____84754
        }else {
          var or__3548__auto____84755 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84755)) {
            return or__3548__auto____84755
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__84795 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84756 = this$;
      if(cljs.core.truth_(and__3546__auto____84756)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84756
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____84757 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84757)) {
          return or__3548__auto____84757
        }else {
          var or__3548__auto____84758 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84758)) {
            return or__3548__auto____84758
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__84796 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84759 = this$;
      if(cljs.core.truth_(and__3546__auto____84759)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84759
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____84760 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84760)) {
          return or__3548__auto____84760
        }else {
          var or__3548__auto____84761 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84761)) {
            return or__3548__auto____84761
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__84797 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84762 = this$;
      if(cljs.core.truth_(and__3546__auto____84762)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84762
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____84763 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84763)) {
          return or__3548__auto____84763
        }else {
          var or__3548__auto____84764 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84764)) {
            return or__3548__auto____84764
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__84798 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84765 = this$;
      if(cljs.core.truth_(and__3546__auto____84765)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84765
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____84766 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84766)) {
          return or__3548__auto____84766
        }else {
          var or__3548__auto____84767 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84767)) {
            return or__3548__auto____84767
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__84799 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84768 = this$;
      if(cljs.core.truth_(and__3546__auto____84768)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84768
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____84769 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84769)) {
          return or__3548__auto____84769
        }else {
          var or__3548__auto____84770 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84770)) {
            return or__3548__auto____84770
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__84800 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84771 = this$;
      if(cljs.core.truth_(and__3546__auto____84771)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84771
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____84772 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84772)) {
          return or__3548__auto____84772
        }else {
          var or__3548__auto____84773 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84773)) {
            return or__3548__auto____84773
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__84801 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84774 = this$;
      if(cljs.core.truth_(and__3546__auto____84774)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84774
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____84775 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84775)) {
          return or__3548__auto____84775
        }else {
          var or__3548__auto____84776 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84776)) {
            return or__3548__auto____84776
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__84802 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84777 = this$;
      if(cljs.core.truth_(and__3546__auto____84777)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84777
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____84778 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84778)) {
          return or__3548__auto____84778
        }else {
          var or__3548__auto____84779 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84779)) {
            return or__3548__auto____84779
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__84803 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84780 = this$;
      if(cljs.core.truth_(and__3546__auto____84780)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____84780
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____84781 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____84781)) {
          return or__3548__auto____84781
        }else {
          var or__3548__auto____84782 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____84782)) {
            return or__3548__auto____84782
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__84783.call(this, this$);
      case 2:
        return _invoke__84784.call(this, this$, a);
      case 3:
        return _invoke__84785.call(this, this$, a, b);
      case 4:
        return _invoke__84786.call(this, this$, a, b, c);
      case 5:
        return _invoke__84787.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__84788.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__84789.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__84790.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__84791.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__84792.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__84793.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__84794.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__84795.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__84796.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__84797.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__84798.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__84799.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__84800.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__84801.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__84802.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__84803.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84805 = coll;
    if(cljs.core.truth_(and__3546__auto____84805)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____84805
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____84806 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84806)) {
        return or__3548__auto____84806
      }else {
        var or__3548__auto____84807 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____84807)) {
          return or__3548__auto____84807
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84808 = coll;
    if(cljs.core.truth_(and__3546__auto____84808)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____84808
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____84809 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84809)) {
        return or__3548__auto____84809
      }else {
        var or__3548__auto____84810 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____84810)) {
          return or__3548__auto____84810
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84811 = coll;
    if(cljs.core.truth_(and__3546__auto____84811)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____84811
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____84812 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84812)) {
        return or__3548__auto____84812
      }else {
        var or__3548__auto____84813 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____84813)) {
          return or__3548__auto____84813
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__84820 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84814 = coll;
      if(cljs.core.truth_(and__3546__auto____84814)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____84814
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____84815 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____84815)) {
          return or__3548__auto____84815
        }else {
          var or__3548__auto____84816 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____84816)) {
            return or__3548__auto____84816
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__84821 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84817 = coll;
      if(cljs.core.truth_(and__3546__auto____84817)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____84817
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____84818 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____84818)) {
          return or__3548__auto____84818
        }else {
          var or__3548__auto____84819 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____84819)) {
            return or__3548__auto____84819
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__84820.call(this, coll, n);
      case 3:
        return _nth__84821.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84823 = coll;
    if(cljs.core.truth_(and__3546__auto____84823)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____84823
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____84824 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84824)) {
        return or__3548__auto____84824
      }else {
        var or__3548__auto____84825 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____84825)) {
          return or__3548__auto____84825
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84826 = coll;
    if(cljs.core.truth_(and__3546__auto____84826)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____84826
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____84827 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84827)) {
        return or__3548__auto____84827
      }else {
        var or__3548__auto____84828 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____84828)) {
          return or__3548__auto____84828
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__84835 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84829 = o;
      if(cljs.core.truth_(and__3546__auto____84829)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____84829
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____84830 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____84830)) {
          return or__3548__auto____84830
        }else {
          var or__3548__auto____84831 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____84831)) {
            return or__3548__auto____84831
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__84836 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84832 = o;
      if(cljs.core.truth_(and__3546__auto____84832)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____84832
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____84833 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____84833)) {
          return or__3548__auto____84833
        }else {
          var or__3548__auto____84834 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____84834)) {
            return or__3548__auto____84834
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__84835.call(this, o, k);
      case 3:
        return _lookup__84836.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84838 = coll;
    if(cljs.core.truth_(and__3546__auto____84838)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____84838
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____84839 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84839)) {
        return or__3548__auto____84839
      }else {
        var or__3548__auto____84840 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____84840)) {
          return or__3548__auto____84840
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84841 = coll;
    if(cljs.core.truth_(and__3546__auto____84841)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____84841
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____84842 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84842)) {
        return or__3548__auto____84842
      }else {
        var or__3548__auto____84843 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____84843)) {
          return or__3548__auto____84843
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84844 = coll;
    if(cljs.core.truth_(and__3546__auto____84844)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____84844
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____84845 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84845)) {
        return or__3548__auto____84845
      }else {
        var or__3548__auto____84846 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____84846)) {
          return or__3548__auto____84846
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84847 = coll;
    if(cljs.core.truth_(and__3546__auto____84847)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____84847
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____84848 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84848)) {
        return or__3548__auto____84848
      }else {
        var or__3548__auto____84849 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____84849)) {
          return or__3548__auto____84849
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84850 = coll;
    if(cljs.core.truth_(and__3546__auto____84850)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____84850
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____84851 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84851)) {
        return or__3548__auto____84851
      }else {
        var or__3548__auto____84852 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____84852)) {
          return or__3548__auto____84852
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84853 = coll;
    if(cljs.core.truth_(and__3546__auto____84853)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____84853
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____84854 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84854)) {
        return or__3548__auto____84854
      }else {
        var or__3548__auto____84855 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____84855)) {
          return or__3548__auto____84855
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84856 = coll;
    if(cljs.core.truth_(and__3546__auto____84856)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____84856
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____84857 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____84857)) {
        return or__3548__auto____84857
      }else {
        var or__3548__auto____84858 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____84858)) {
          return or__3548__auto____84858
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84859 = o;
    if(cljs.core.truth_(and__3546__auto____84859)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____84859
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____84860 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____84860)) {
        return or__3548__auto____84860
      }else {
        var or__3548__auto____84861 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____84861)) {
          return or__3548__auto____84861
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84862 = o;
    if(cljs.core.truth_(and__3546__auto____84862)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____84862
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____84863 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____84863)) {
        return or__3548__auto____84863
      }else {
        var or__3548__auto____84864 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____84864)) {
          return or__3548__auto____84864
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84865 = o;
    if(cljs.core.truth_(and__3546__auto____84865)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____84865
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____84866 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____84866)) {
        return or__3548__auto____84866
      }else {
        var or__3548__auto____84867 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____84867)) {
          return or__3548__auto____84867
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84868 = o;
    if(cljs.core.truth_(and__3546__auto____84868)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____84868
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____84869 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____84869)) {
        return or__3548__auto____84869
      }else {
        var or__3548__auto____84870 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____84870)) {
          return or__3548__auto____84870
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__84877 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84871 = coll;
      if(cljs.core.truth_(and__3546__auto____84871)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____84871
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____84872 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____84872)) {
          return or__3548__auto____84872
        }else {
          var or__3548__auto____84873 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____84873)) {
            return or__3548__auto____84873
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__84878 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____84874 = coll;
      if(cljs.core.truth_(and__3546__auto____84874)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____84874
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____84875 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____84875)) {
          return or__3548__auto____84875
        }else {
          var or__3548__auto____84876 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____84876)) {
            return or__3548__auto____84876
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__84877.call(this, coll, f);
      case 3:
        return _reduce__84878.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84880 = o;
    if(cljs.core.truth_(and__3546__auto____84880)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____84880
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____84881 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____84881)) {
        return or__3548__auto____84881
      }else {
        var or__3548__auto____84882 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____84882)) {
          return or__3548__auto____84882
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84883 = o;
    if(cljs.core.truth_(and__3546__auto____84883)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____84883
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____84884 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____84884)) {
        return or__3548__auto____84884
      }else {
        var or__3548__auto____84885 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____84885)) {
          return or__3548__auto____84885
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84886 = o;
    if(cljs.core.truth_(and__3546__auto____84886)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____84886
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____84887 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____84887)) {
        return or__3548__auto____84887
      }else {
        var or__3548__auto____84888 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____84888)) {
          return or__3548__auto____84888
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84889 = o;
    if(cljs.core.truth_(and__3546__auto____84889)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____84889
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____84890 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____84890)) {
        return or__3548__auto____84890
      }else {
        var or__3548__auto____84891 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____84891)) {
          return or__3548__auto____84891
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84892 = d;
    if(cljs.core.truth_(and__3546__auto____84892)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____84892
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____84893 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____84893)) {
        return or__3548__auto____84893
      }else {
        var or__3548__auto____84894 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____84894)) {
          return or__3548__auto____84894
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84895 = this$;
    if(cljs.core.truth_(and__3546__auto____84895)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____84895
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____84896 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____84896)) {
        return or__3548__auto____84896
      }else {
        var or__3548__auto____84897 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____84897)) {
          return or__3548__auto____84897
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84898 = this$;
    if(cljs.core.truth_(and__3546__auto____84898)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____84898
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____84899 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____84899)) {
        return or__3548__auto____84899
      }else {
        var or__3548__auto____84900 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____84900)) {
          return or__3548__auto____84900
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____84901 = this$;
    if(cljs.core.truth_(and__3546__auto____84901)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____84901
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____84902 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____84902)) {
        return or__3548__auto____84902
      }else {
        var or__3548__auto____84903 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____84903)) {
          return or__3548__auto____84903
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__84904 = null;
  var G__84904__84905 = function(o, k) {
    return null
  };
  var G__84904__84906 = function(o, k, not_found) {
    return not_found
  };
  G__84904 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__84904__84905.call(this, o, k);
      case 3:
        return G__84904__84906.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__84904
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__84908 = null;
  var G__84908__84909 = function(_, f) {
    return f.call(null)
  };
  var G__84908__84910 = function(_, f, start) {
    return start
  };
  G__84908 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__84908__84909.call(this, _, f);
      case 3:
        return G__84908__84910.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__84908
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__84912 = null;
  var G__84912__84913 = function(_, n) {
    return null
  };
  var G__84912__84914 = function(_, n, not_found) {
    return not_found
  };
  G__84912 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__84912__84913.call(this, _, n);
      case 3:
        return G__84912__84914.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__84912
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__84922 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__84916 = cljs.core._nth.call(null, cicoll, 0);
      var n__84917 = 1;
      while(true) {
        if(cljs.core.truth_(n__84917 < cljs.core._count.call(null, cicoll))) {
          var G__84926 = f.call(null, val__84916, cljs.core._nth.call(null, cicoll, n__84917));
          var G__84927 = n__84917 + 1;
          val__84916 = G__84926;
          n__84917 = G__84927;
          continue
        }else {
          return val__84916
        }
        break
      }
    }
  };
  var ci_reduce__84923 = function(cicoll, f, val) {
    var val__84918 = val;
    var n__84919 = 0;
    while(true) {
      if(cljs.core.truth_(n__84919 < cljs.core._count.call(null, cicoll))) {
        var G__84928 = f.call(null, val__84918, cljs.core._nth.call(null, cicoll, n__84919));
        var G__84929 = n__84919 + 1;
        val__84918 = G__84928;
        n__84919 = G__84929;
        continue
      }else {
        return val__84918
      }
      break
    }
  };
  var ci_reduce__84924 = function(cicoll, f, val, idx) {
    var val__84920 = val;
    var n__84921 = idx;
    while(true) {
      if(cljs.core.truth_(n__84921 < cljs.core._count.call(null, cicoll))) {
        var G__84930 = f.call(null, val__84920, cljs.core._nth.call(null, cicoll, n__84921));
        var G__84931 = n__84921 + 1;
        val__84920 = G__84930;
        n__84921 = G__84931;
        continue
      }else {
        return val__84920
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__84922.call(this, cicoll, f);
      case 3:
        return ci_reduce__84923.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__84924.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__84932 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__84945 = null;
  var G__84945__84946 = function(_, f) {
    var this__84933 = this;
    return cljs.core.ci_reduce.call(null, this__84933.a, f, this__84933.a[this__84933.i], this__84933.i + 1)
  };
  var G__84945__84947 = function(_, f, start) {
    var this__84934 = this;
    return cljs.core.ci_reduce.call(null, this__84934.a, f, start, this__84934.i)
  };
  G__84945 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__84945__84946.call(this, _, f);
      case 3:
        return G__84945__84947.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__84945
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__84935 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__84936 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__84949 = null;
  var G__84949__84950 = function(coll, n) {
    var this__84937 = this;
    var i__84938 = n + this__84937.i;
    if(cljs.core.truth_(i__84938 < this__84937.a.length)) {
      return this__84937.a[i__84938]
    }else {
      return null
    }
  };
  var G__84949__84951 = function(coll, n, not_found) {
    var this__84939 = this;
    var i__84940 = n + this__84939.i;
    if(cljs.core.truth_(i__84940 < this__84939.a.length)) {
      return this__84939.a[i__84940]
    }else {
      return not_found
    }
  };
  G__84949 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__84949__84950.call(this, coll, n);
      case 3:
        return G__84949__84951.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__84949
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__84941 = this;
  return this__84941.a.length - this__84941.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__84942 = this;
  return this__84942.a[this__84942.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__84943 = this;
  if(cljs.core.truth_(this__84943.i + 1 < this__84943.a.length)) {
    return new cljs.core.IndexedSeq(this__84943.a, this__84943.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__84944 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__84953 = null;
  var G__84953__84954 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__84953__84955 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__84953 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__84953__84954.call(this, array, f);
      case 3:
        return G__84953__84955.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__84953
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__84957 = null;
  var G__84957__84958 = function(array, k) {
    return array[k]
  };
  var G__84957__84959 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__84957 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__84957__84958.call(this, array, k);
      case 3:
        return G__84957__84959.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__84957
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__84961 = null;
  var G__84961__84962 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__84961__84963 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__84961 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__84961__84962.call(this, array, n);
      case 3:
        return G__84961__84963.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__84961
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____84965 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____84965)) {
    var s__84966 = temp__3698__auto____84965;
    return cljs.core._first.call(null, s__84966)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__84967 = cljs.core.next.call(null, s);
      s = G__84967;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__84968 = cljs.core.seq.call(null, x);
  var n__84969 = 0;
  while(true) {
    if(cljs.core.truth_(s__84968)) {
      var G__84970 = cljs.core.next.call(null, s__84968);
      var G__84971 = n__84969 + 1;
      s__84968 = G__84970;
      n__84969 = G__84971;
      continue
    }else {
      return n__84969
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__84972 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__84973 = function() {
    var G__84975__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__84976 = conj.call(null, coll, x);
          var G__84977 = cljs.core.first.call(null, xs);
          var G__84978 = cljs.core.next.call(null, xs);
          coll = G__84976;
          x = G__84977;
          xs = G__84978;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__84975 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__84975__delegate.call(this, coll, x, xs)
    };
    G__84975.cljs$lang$maxFixedArity = 2;
    G__84975.cljs$lang$applyTo = function(arglist__84979) {
      var coll = cljs.core.first(arglist__84979);
      var x = cljs.core.first(cljs.core.next(arglist__84979));
      var xs = cljs.core.rest(cljs.core.next(arglist__84979));
      return G__84975__delegate.call(this, coll, x, xs)
    };
    return G__84975
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__84972.call(this, coll, x);
      default:
        return conj__84973.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__84973.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__84980 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__84981 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__84980.call(this, coll, n);
      case 3:
        return nth__84981.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__84983 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__84984 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__84983.call(this, o, k);
      case 3:
        return get__84984.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__84987 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__84988 = function() {
    var G__84990__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__84986 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__84991 = ret__84986;
          var G__84992 = cljs.core.first.call(null, kvs);
          var G__84993 = cljs.core.second.call(null, kvs);
          var G__84994 = cljs.core.nnext.call(null, kvs);
          coll = G__84991;
          k = G__84992;
          v = G__84993;
          kvs = G__84994;
          continue
        }else {
          return ret__84986
        }
        break
      }
    };
    var G__84990 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__84990__delegate.call(this, coll, k, v, kvs)
    };
    G__84990.cljs$lang$maxFixedArity = 3;
    G__84990.cljs$lang$applyTo = function(arglist__84995) {
      var coll = cljs.core.first(arglist__84995);
      var k = cljs.core.first(cljs.core.next(arglist__84995));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__84995)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__84995)));
      return G__84990__delegate.call(this, coll, k, v, kvs)
    };
    return G__84990
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__84987.call(this, coll, k, v);
      default:
        return assoc__84988.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__84988.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__84997 = function(coll) {
    return coll
  };
  var dissoc__84998 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__84999 = function() {
    var G__85001__delegate = function(coll, k, ks) {
      while(true) {
        var ret__84996 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__85002 = ret__84996;
          var G__85003 = cljs.core.first.call(null, ks);
          var G__85004 = cljs.core.next.call(null, ks);
          coll = G__85002;
          k = G__85003;
          ks = G__85004;
          continue
        }else {
          return ret__84996
        }
        break
      }
    };
    var G__85001 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85001__delegate.call(this, coll, k, ks)
    };
    G__85001.cljs$lang$maxFixedArity = 2;
    G__85001.cljs$lang$applyTo = function(arglist__85005) {
      var coll = cljs.core.first(arglist__85005);
      var k = cljs.core.first(cljs.core.next(arglist__85005));
      var ks = cljs.core.rest(cljs.core.next(arglist__85005));
      return G__85001__delegate.call(this, coll, k, ks)
    };
    return G__85001
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__84997.call(this, coll);
      case 2:
        return dissoc__84998.call(this, coll, k);
      default:
        return dissoc__84999.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__84999.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__450__auto____85006 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____85007 = x__450__auto____85006;
      if(cljs.core.truth_(and__3546__auto____85007)) {
        var and__3546__auto____85008 = x__450__auto____85006.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____85008)) {
          return cljs.core.not.call(null, x__450__auto____85006.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____85008
        }
      }else {
        return and__3546__auto____85007
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____85006)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__85010 = function(coll) {
    return coll
  };
  var disj__85011 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__85012 = function() {
    var G__85014__delegate = function(coll, k, ks) {
      while(true) {
        var ret__85009 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__85015 = ret__85009;
          var G__85016 = cljs.core.first.call(null, ks);
          var G__85017 = cljs.core.next.call(null, ks);
          coll = G__85015;
          k = G__85016;
          ks = G__85017;
          continue
        }else {
          return ret__85009
        }
        break
      }
    };
    var G__85014 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85014__delegate.call(this, coll, k, ks)
    };
    G__85014.cljs$lang$maxFixedArity = 2;
    G__85014.cljs$lang$applyTo = function(arglist__85018) {
      var coll = cljs.core.first(arglist__85018);
      var k = cljs.core.first(cljs.core.next(arglist__85018));
      var ks = cljs.core.rest(cljs.core.next(arglist__85018));
      return G__85014__delegate.call(this, coll, k, ks)
    };
    return G__85014
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__85010.call(this, coll);
      case 2:
        return disj__85011.call(this, coll, k);
      default:
        return disj__85012.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__85012.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____85019 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____85020 = x__450__auto____85019;
      if(cljs.core.truth_(and__3546__auto____85020)) {
        var and__3546__auto____85021 = x__450__auto____85019.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____85021)) {
          return cljs.core.not.call(null, x__450__auto____85019.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____85021
        }
      }else {
        return and__3546__auto____85020
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__450__auto____85019)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____85022 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____85023 = x__450__auto____85022;
      if(cljs.core.truth_(and__3546__auto____85023)) {
        var and__3546__auto____85024 = x__450__auto____85022.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____85024)) {
          return cljs.core.not.call(null, x__450__auto____85022.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____85024
        }
      }else {
        return and__3546__auto____85023
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__450__auto____85022)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__450__auto____85025 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____85026 = x__450__auto____85025;
    if(cljs.core.truth_(and__3546__auto____85026)) {
      var and__3546__auto____85027 = x__450__auto____85025.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____85027)) {
        return cljs.core.not.call(null, x__450__auto____85025.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____85027
      }
    }else {
      return and__3546__auto____85026
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__450__auto____85025)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__450__auto____85028 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____85029 = x__450__auto____85028;
    if(cljs.core.truth_(and__3546__auto____85029)) {
      var and__3546__auto____85030 = x__450__auto____85028.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____85030)) {
        return cljs.core.not.call(null, x__450__auto____85028.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____85030
      }
    }else {
      return and__3546__auto____85029
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__450__auto____85028)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__450__auto____85031 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____85032 = x__450__auto____85031;
    if(cljs.core.truth_(and__3546__auto____85032)) {
      var and__3546__auto____85033 = x__450__auto____85031.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____85033)) {
        return cljs.core.not.call(null, x__450__auto____85031.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____85033
      }
    }else {
      return and__3546__auto____85032
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__450__auto____85031)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____85034 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____85035 = x__450__auto____85034;
      if(cljs.core.truth_(and__3546__auto____85035)) {
        var and__3546__auto____85036 = x__450__auto____85034.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____85036)) {
          return cljs.core.not.call(null, x__450__auto____85034.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____85036
        }
      }else {
        return and__3546__auto____85035
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__450__auto____85034)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__450__auto____85037 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____85038 = x__450__auto____85037;
    if(cljs.core.truth_(and__3546__auto____85038)) {
      var and__3546__auto____85039 = x__450__auto____85037.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____85039)) {
        return cljs.core.not.call(null, x__450__auto____85037.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____85039
      }
    }else {
      return and__3546__auto____85038
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__450__auto____85037)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__85040 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__85040.push(key)
  });
  return keys__85040
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__450__auto____85041 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____85042 = x__450__auto____85041;
      if(cljs.core.truth_(and__3546__auto____85042)) {
        var and__3546__auto____85043 = x__450__auto____85041.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____85043)) {
          return cljs.core.not.call(null, x__450__auto____85041.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____85043
        }
      }else {
        return and__3546__auto____85042
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__450__auto____85041)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____85044 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____85044)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____85045 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____85045)) {
        return or__3548__auto____85045
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____85044
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____85046 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____85046)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____85046
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____85047 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____85047)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____85047
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____85048 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____85048)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____85048
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____85049 = coll;
    if(cljs.core.truth_(and__3546__auto____85049)) {
      var and__3546__auto____85050 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____85050)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____85050
      }
    }else {
      return and__3546__auto____85049
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___85055 = function(x) {
    return true
  };
  var distinct_QMARK___85056 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___85057 = function() {
    var G__85059__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__85051 = cljs.core.set([y, x]);
        var xs__85052 = more;
        while(true) {
          var x__85053 = cljs.core.first.call(null, xs__85052);
          var etc__85054 = cljs.core.next.call(null, xs__85052);
          if(cljs.core.truth_(xs__85052)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__85051, x__85053))) {
              return false
            }else {
              var G__85060 = cljs.core.conj.call(null, s__85051, x__85053);
              var G__85061 = etc__85054;
              s__85051 = G__85060;
              xs__85052 = G__85061;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__85059 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85059__delegate.call(this, x, y, more)
    };
    G__85059.cljs$lang$maxFixedArity = 2;
    G__85059.cljs$lang$applyTo = function(arglist__85062) {
      var x = cljs.core.first(arglist__85062);
      var y = cljs.core.first(cljs.core.next(arglist__85062));
      var more = cljs.core.rest(cljs.core.next(arglist__85062));
      return G__85059__delegate.call(this, x, y, more)
    };
    return G__85059
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___85055.call(this, x);
      case 2:
        return distinct_QMARK___85056.call(this, x, y);
      default:
        return distinct_QMARK___85057.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___85057.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__85063 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__85063))) {
        return r__85063
      }else {
        if(cljs.core.truth_(r__85063)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__85065 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__85066 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__85064 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__85064, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__85064)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__85065.call(this, comp);
      case 2:
        return sort__85066.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__85068 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__85069 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__85068.call(this, keyfn, comp);
      case 3:
        return sort_by__85069.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__85071 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__85072 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__85071.call(this, f, val);
      case 3:
        return reduce__85072.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__85078 = function(f, coll) {
    var temp__3695__auto____85074 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____85074)) {
      var s__85075 = temp__3695__auto____85074;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__85075), cljs.core.next.call(null, s__85075))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__85079 = function(f, val, coll) {
    var val__85076 = val;
    var coll__85077 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__85077)) {
        var G__85081 = f.call(null, val__85076, cljs.core.first.call(null, coll__85077));
        var G__85082 = cljs.core.next.call(null, coll__85077);
        val__85076 = G__85081;
        coll__85077 = G__85082;
        continue
      }else {
        return val__85076
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__85078.call(this, f, val);
      case 3:
        return seq_reduce__85079.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__85083 = null;
  var G__85083__85084 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__85083__85085 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__85083 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__85083__85084.call(this, coll, f);
      case 3:
        return G__85083__85085.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85083
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___85087 = function() {
    return 0
  };
  var _PLUS___85088 = function(x) {
    return x
  };
  var _PLUS___85089 = function(x, y) {
    return x + y
  };
  var _PLUS___85090 = function() {
    var G__85092__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__85092 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85092__delegate.call(this, x, y, more)
    };
    G__85092.cljs$lang$maxFixedArity = 2;
    G__85092.cljs$lang$applyTo = function(arglist__85093) {
      var x = cljs.core.first(arglist__85093);
      var y = cljs.core.first(cljs.core.next(arglist__85093));
      var more = cljs.core.rest(cljs.core.next(arglist__85093));
      return G__85092__delegate.call(this, x, y, more)
    };
    return G__85092
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___85087.call(this);
      case 1:
        return _PLUS___85088.call(this, x);
      case 2:
        return _PLUS___85089.call(this, x, y);
      default:
        return _PLUS___85090.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___85090.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___85094 = function(x) {
    return-x
  };
  var ___85095 = function(x, y) {
    return x - y
  };
  var ___85096 = function() {
    var G__85098__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__85098 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85098__delegate.call(this, x, y, more)
    };
    G__85098.cljs$lang$maxFixedArity = 2;
    G__85098.cljs$lang$applyTo = function(arglist__85099) {
      var x = cljs.core.first(arglist__85099);
      var y = cljs.core.first(cljs.core.next(arglist__85099));
      var more = cljs.core.rest(cljs.core.next(arglist__85099));
      return G__85098__delegate.call(this, x, y, more)
    };
    return G__85098
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___85094.call(this, x);
      case 2:
        return ___85095.call(this, x, y);
      default:
        return ___85096.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___85096.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___85100 = function() {
    return 1
  };
  var _STAR___85101 = function(x) {
    return x
  };
  var _STAR___85102 = function(x, y) {
    return x * y
  };
  var _STAR___85103 = function() {
    var G__85105__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__85105 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85105__delegate.call(this, x, y, more)
    };
    G__85105.cljs$lang$maxFixedArity = 2;
    G__85105.cljs$lang$applyTo = function(arglist__85106) {
      var x = cljs.core.first(arglist__85106);
      var y = cljs.core.first(cljs.core.next(arglist__85106));
      var more = cljs.core.rest(cljs.core.next(arglist__85106));
      return G__85105__delegate.call(this, x, y, more)
    };
    return G__85105
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___85100.call(this);
      case 1:
        return _STAR___85101.call(this, x);
      case 2:
        return _STAR___85102.call(this, x, y);
      default:
        return _STAR___85103.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___85103.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___85107 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___85108 = function(x, y) {
    return x / y
  };
  var _SLASH___85109 = function() {
    var G__85111__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__85111 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85111__delegate.call(this, x, y, more)
    };
    G__85111.cljs$lang$maxFixedArity = 2;
    G__85111.cljs$lang$applyTo = function(arglist__85112) {
      var x = cljs.core.first(arglist__85112);
      var y = cljs.core.first(cljs.core.next(arglist__85112));
      var more = cljs.core.rest(cljs.core.next(arglist__85112));
      return G__85111__delegate.call(this, x, y, more)
    };
    return G__85111
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___85107.call(this, x);
      case 2:
        return _SLASH___85108.call(this, x, y);
      default:
        return _SLASH___85109.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___85109.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___85113 = function(x) {
    return true
  };
  var _LT___85114 = function(x, y) {
    return x < y
  };
  var _LT___85115 = function() {
    var G__85117__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__85118 = y;
            var G__85119 = cljs.core.first.call(null, more);
            var G__85120 = cljs.core.next.call(null, more);
            x = G__85118;
            y = G__85119;
            more = G__85120;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__85117 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85117__delegate.call(this, x, y, more)
    };
    G__85117.cljs$lang$maxFixedArity = 2;
    G__85117.cljs$lang$applyTo = function(arglist__85121) {
      var x = cljs.core.first(arglist__85121);
      var y = cljs.core.first(cljs.core.next(arglist__85121));
      var more = cljs.core.rest(cljs.core.next(arglist__85121));
      return G__85117__delegate.call(this, x, y, more)
    };
    return G__85117
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___85113.call(this, x);
      case 2:
        return _LT___85114.call(this, x, y);
      default:
        return _LT___85115.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___85115.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___85122 = function(x) {
    return true
  };
  var _LT__EQ___85123 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___85124 = function() {
    var G__85126__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__85127 = y;
            var G__85128 = cljs.core.first.call(null, more);
            var G__85129 = cljs.core.next.call(null, more);
            x = G__85127;
            y = G__85128;
            more = G__85129;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__85126 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85126__delegate.call(this, x, y, more)
    };
    G__85126.cljs$lang$maxFixedArity = 2;
    G__85126.cljs$lang$applyTo = function(arglist__85130) {
      var x = cljs.core.first(arglist__85130);
      var y = cljs.core.first(cljs.core.next(arglist__85130));
      var more = cljs.core.rest(cljs.core.next(arglist__85130));
      return G__85126__delegate.call(this, x, y, more)
    };
    return G__85126
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___85122.call(this, x);
      case 2:
        return _LT__EQ___85123.call(this, x, y);
      default:
        return _LT__EQ___85124.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___85124.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___85131 = function(x) {
    return true
  };
  var _GT___85132 = function(x, y) {
    return x > y
  };
  var _GT___85133 = function() {
    var G__85135__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__85136 = y;
            var G__85137 = cljs.core.first.call(null, more);
            var G__85138 = cljs.core.next.call(null, more);
            x = G__85136;
            y = G__85137;
            more = G__85138;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__85135 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85135__delegate.call(this, x, y, more)
    };
    G__85135.cljs$lang$maxFixedArity = 2;
    G__85135.cljs$lang$applyTo = function(arglist__85139) {
      var x = cljs.core.first(arglist__85139);
      var y = cljs.core.first(cljs.core.next(arglist__85139));
      var more = cljs.core.rest(cljs.core.next(arglist__85139));
      return G__85135__delegate.call(this, x, y, more)
    };
    return G__85135
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___85131.call(this, x);
      case 2:
        return _GT___85132.call(this, x, y);
      default:
        return _GT___85133.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___85133.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___85140 = function(x) {
    return true
  };
  var _GT__EQ___85141 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___85142 = function() {
    var G__85144__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__85145 = y;
            var G__85146 = cljs.core.first.call(null, more);
            var G__85147 = cljs.core.next.call(null, more);
            x = G__85145;
            y = G__85146;
            more = G__85147;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__85144 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85144__delegate.call(this, x, y, more)
    };
    G__85144.cljs$lang$maxFixedArity = 2;
    G__85144.cljs$lang$applyTo = function(arglist__85148) {
      var x = cljs.core.first(arglist__85148);
      var y = cljs.core.first(cljs.core.next(arglist__85148));
      var more = cljs.core.rest(cljs.core.next(arglist__85148));
      return G__85144__delegate.call(this, x, y, more)
    };
    return G__85144
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___85140.call(this, x);
      case 2:
        return _GT__EQ___85141.call(this, x, y);
      default:
        return _GT__EQ___85142.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___85142.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__85149 = function(x) {
    return x
  };
  var max__85150 = function(x, y) {
    return x > y ? x : y
  };
  var max__85151 = function() {
    var G__85153__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__85153 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85153__delegate.call(this, x, y, more)
    };
    G__85153.cljs$lang$maxFixedArity = 2;
    G__85153.cljs$lang$applyTo = function(arglist__85154) {
      var x = cljs.core.first(arglist__85154);
      var y = cljs.core.first(cljs.core.next(arglist__85154));
      var more = cljs.core.rest(cljs.core.next(arglist__85154));
      return G__85153__delegate.call(this, x, y, more)
    };
    return G__85153
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__85149.call(this, x);
      case 2:
        return max__85150.call(this, x, y);
      default:
        return max__85151.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__85151.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__85155 = function(x) {
    return x
  };
  var min__85156 = function(x, y) {
    return x < y ? x : y
  };
  var min__85157 = function() {
    var G__85159__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__85159 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85159__delegate.call(this, x, y, more)
    };
    G__85159.cljs$lang$maxFixedArity = 2;
    G__85159.cljs$lang$applyTo = function(arglist__85160) {
      var x = cljs.core.first(arglist__85160);
      var y = cljs.core.first(cljs.core.next(arglist__85160));
      var more = cljs.core.rest(cljs.core.next(arglist__85160));
      return G__85159__delegate.call(this, x, y, more)
    };
    return G__85159
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__85155.call(this, x);
      case 2:
        return min__85156.call(this, x, y);
      default:
        return min__85157.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__85157.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__85161 = n % d;
  return cljs.core.fix.call(null, (n - rem__85161) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__85162 = cljs.core.quot.call(null, n, d);
  return n - d * q__85162
};
cljs.core.rand = function() {
  var rand = null;
  var rand__85163 = function() {
    return Math.random.call(null)
  };
  var rand__85164 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__85163.call(this);
      case 1:
        return rand__85164.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___85166 = function(x) {
    return true
  };
  var _EQ__EQ___85167 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___85168 = function() {
    var G__85170__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__85171 = y;
            var G__85172 = cljs.core.first.call(null, more);
            var G__85173 = cljs.core.next.call(null, more);
            x = G__85171;
            y = G__85172;
            more = G__85173;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__85170 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85170__delegate.call(this, x, y, more)
    };
    G__85170.cljs$lang$maxFixedArity = 2;
    G__85170.cljs$lang$applyTo = function(arglist__85174) {
      var x = cljs.core.first(arglist__85174);
      var y = cljs.core.first(cljs.core.next(arglist__85174));
      var more = cljs.core.rest(cljs.core.next(arglist__85174));
      return G__85170__delegate.call(this, x, y, more)
    };
    return G__85170
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___85166.call(this, x);
      case 2:
        return _EQ__EQ___85167.call(this, x, y);
      default:
        return _EQ__EQ___85168.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___85168.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__85175 = n;
  var xs__85176 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____85177 = xs__85176;
      if(cljs.core.truth_(and__3546__auto____85177)) {
        return n__85175 > 0
      }else {
        return and__3546__auto____85177
      }
    }())) {
      var G__85178 = n__85175 - 1;
      var G__85179 = cljs.core.next.call(null, xs__85176);
      n__85175 = G__85178;
      xs__85176 = G__85179;
      continue
    }else {
      return xs__85176
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__85184 = null;
  var G__85184__85185 = function(coll, n) {
    var temp__3695__auto____85180 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____85180)) {
      var xs__85181 = temp__3695__auto____85180;
      return cljs.core.first.call(null, xs__85181)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__85184__85186 = function(coll, n, not_found) {
    var temp__3695__auto____85182 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____85182)) {
      var xs__85183 = temp__3695__auto____85182;
      return cljs.core.first.call(null, xs__85183)
    }else {
      return not_found
    }
  };
  G__85184 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85184__85185.call(this, coll, n);
      case 3:
        return G__85184__85186.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85184
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___85188 = function() {
    return""
  };
  var str_STAR___85189 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___85190 = function() {
    var G__85192__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__85193 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__85194 = cljs.core.next.call(null, more);
            sb = G__85193;
            more = G__85194;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__85192 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__85192__delegate.call(this, x, ys)
    };
    G__85192.cljs$lang$maxFixedArity = 1;
    G__85192.cljs$lang$applyTo = function(arglist__85195) {
      var x = cljs.core.first(arglist__85195);
      var ys = cljs.core.rest(arglist__85195);
      return G__85192__delegate.call(this, x, ys)
    };
    return G__85192
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___85188.call(this);
      case 1:
        return str_STAR___85189.call(this, x);
      default:
        return str_STAR___85190.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___85190.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__85196 = function() {
    return""
  };
  var str__85197 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__85198 = function() {
    var G__85200__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__85200 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__85200__delegate.call(this, x, ys)
    };
    G__85200.cljs$lang$maxFixedArity = 1;
    G__85200.cljs$lang$applyTo = function(arglist__85201) {
      var x = cljs.core.first(arglist__85201);
      var ys = cljs.core.rest(arglist__85201);
      return G__85200__delegate.call(this, x, ys)
    };
    return G__85200
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__85196.call(this);
      case 1:
        return str__85197.call(this, x);
      default:
        return str__85198.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__85198.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__85202 = function(s, start) {
    return s.substring(start)
  };
  var subs__85203 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__85202.call(this, s, start);
      case 3:
        return subs__85203.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__85205 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__85206 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__85205.call(this, ns);
      case 2:
        return symbol__85206.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__85208 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__85209 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__85208.call(this, ns);
      case 2:
        return keyword__85209.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__85211 = cljs.core.seq.call(null, x);
    var ys__85212 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__85211 === null)) {
        return ys__85212 === null
      }else {
        if(cljs.core.truth_(ys__85212 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__85211), cljs.core.first.call(null, ys__85212)))) {
            var G__85213 = cljs.core.next.call(null, xs__85211);
            var G__85214 = cljs.core.next.call(null, ys__85212);
            xs__85211 = G__85213;
            ys__85212 = G__85214;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__85215_SHARP_, p2__85216_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__85215_SHARP_, cljs.core.hash.call(null, p2__85216_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__85217__85218 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__85217__85218)) {
    var G__85220__85222 = cljs.core.first.call(null, G__85217__85218);
    var vec__85221__85223 = G__85220__85222;
    var key_name__85224 = cljs.core.nth.call(null, vec__85221__85223, 0, null);
    var f__85225 = cljs.core.nth.call(null, vec__85221__85223, 1, null);
    var G__85217__85226 = G__85217__85218;
    var G__85220__85227 = G__85220__85222;
    var G__85217__85228 = G__85217__85226;
    while(true) {
      var vec__85229__85230 = G__85220__85227;
      var key_name__85231 = cljs.core.nth.call(null, vec__85229__85230, 0, null);
      var f__85232 = cljs.core.nth.call(null, vec__85229__85230, 1, null);
      var G__85217__85233 = G__85217__85228;
      var str_name__85234 = cljs.core.name.call(null, key_name__85231);
      obj[str_name__85234] = f__85232;
      var temp__3698__auto____85235 = cljs.core.next.call(null, G__85217__85233);
      if(cljs.core.truth_(temp__3698__auto____85235)) {
        var G__85217__85236 = temp__3698__auto____85235;
        var G__85237 = cljs.core.first.call(null, G__85217__85236);
        var G__85238 = G__85217__85236;
        G__85220__85227 = G__85237;
        G__85217__85228 = G__85238;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85239 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85240 = this;
  return new cljs.core.List(this__85240.meta, o, coll, this__85240.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85241 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__85242 = this;
  return this__85242.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__85243 = this;
  return this__85243.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__85244 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__85245 = this;
  return this__85245.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__85246 = this;
  return this__85246.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85247 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85248 = this;
  return new cljs.core.List(meta, this__85248.first, this__85248.rest, this__85248.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85249 = this;
  return this__85249.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85250 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85251 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85252 = this;
  return new cljs.core.List(this__85252.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85253 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__85254 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__85255 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__85256 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__85257 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__85258 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85259 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85260 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85261 = this;
  return this__85261.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85262 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__85263) {
    var items = cljs.core.seq(arglist__85263);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85264 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85265 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85266 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85267 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__85267.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85268 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__85269 = this;
  return this__85269.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__85270 = this;
  if(cljs.core.truth_(this__85270.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__85270.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85271 = this;
  return this__85271.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85272 = this;
  return new cljs.core.Cons(meta, this__85272.first, this__85272.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__85273 = null;
  var G__85273__85274 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__85273__85275 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__85273 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__85273__85274.call(this, string, f);
      case 3:
        return G__85273__85275.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85273
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__85277 = null;
  var G__85277__85278 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__85277__85279 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__85277 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85277__85278.call(this, string, k);
      case 3:
        return G__85277__85279.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85277
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__85281 = null;
  var G__85281__85282 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__85281__85283 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__85281 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85281__85282.call(this, string, n);
      case 3:
        return G__85281__85283.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85281
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__85291 = null;
  var G__85291__85292 = function(tsym85285, coll) {
    var tsym85285__85287 = this;
    var this$__85288 = tsym85285__85287;
    return cljs.core.get.call(null, coll, this$__85288.toString())
  };
  var G__85291__85293 = function(tsym85286, coll, not_found) {
    var tsym85286__85289 = this;
    var this$__85290 = tsym85286__85289;
    return cljs.core.get.call(null, coll, this$__85290.toString(), not_found)
  };
  G__85291 = function(tsym85286, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85291__85292.call(this, tsym85286, coll);
      case 3:
        return G__85291__85293.call(this, tsym85286, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85291
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__85295 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__85295
  }else {
    lazy_seq.x = x__85295.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85296 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85297 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85298 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85299 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__85299.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85300 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__85301 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__85302 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85303 = this;
  return this__85303.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85304 = this;
  return new cljs.core.LazySeq(meta, this__85304.realized, this__85304.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__85305 = cljs.core.array.call(null);
  var s__85306 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__85306))) {
      ary__85305.push(cljs.core.first.call(null, s__85306));
      var G__85307 = cljs.core.next.call(null, s__85306);
      s__85306 = G__85307;
      continue
    }else {
      return ary__85305
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__85308 = s;
  var i__85309 = n;
  var sum__85310 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____85311 = i__85309 > 0;
      if(cljs.core.truth_(and__3546__auto____85311)) {
        return cljs.core.seq.call(null, s__85308)
      }else {
        return and__3546__auto____85311
      }
    }())) {
      var G__85312 = cljs.core.next.call(null, s__85308);
      var G__85313 = i__85309 - 1;
      var G__85314 = sum__85310 + 1;
      s__85308 = G__85312;
      i__85309 = G__85313;
      sum__85310 = G__85314;
      continue
    }else {
      return sum__85310
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__85318 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__85319 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__85320 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__85315 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__85315)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__85315), concat.call(null, cljs.core.rest.call(null, s__85315), y))
      }else {
        return y
      }
    })
  };
  var concat__85321 = function() {
    var G__85323__delegate = function(x, y, zs) {
      var cat__85317 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__85316 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__85316)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__85316), cat.call(null, cljs.core.rest.call(null, xys__85316), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__85317.call(null, concat.call(null, x, y), zs)
    };
    var G__85323 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85323__delegate.call(this, x, y, zs)
    };
    G__85323.cljs$lang$maxFixedArity = 2;
    G__85323.cljs$lang$applyTo = function(arglist__85324) {
      var x = cljs.core.first(arglist__85324);
      var y = cljs.core.first(cljs.core.next(arglist__85324));
      var zs = cljs.core.rest(cljs.core.next(arglist__85324));
      return G__85323__delegate.call(this, x, y, zs)
    };
    return G__85323
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__85318.call(this);
      case 1:
        return concat__85319.call(this, x);
      case 2:
        return concat__85320.call(this, x, y);
      default:
        return concat__85321.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__85321.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___85325 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___85326 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___85327 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___85328 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___85329 = function() {
    var G__85331__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__85331 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__85331__delegate.call(this, a, b, c, d, more)
    };
    G__85331.cljs$lang$maxFixedArity = 4;
    G__85331.cljs$lang$applyTo = function(arglist__85332) {
      var a = cljs.core.first(arglist__85332);
      var b = cljs.core.first(cljs.core.next(arglist__85332));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85332)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85332))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85332))));
      return G__85331__delegate.call(this, a, b, c, d, more)
    };
    return G__85331
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___85325.call(this, a);
      case 2:
        return list_STAR___85326.call(this, a, b);
      case 3:
        return list_STAR___85327.call(this, a, b, c);
      case 4:
        return list_STAR___85328.call(this, a, b, c, d);
      default:
        return list_STAR___85329.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___85329.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__85342 = function(f, args) {
    var fixed_arity__85333 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__85333 + 1) <= fixed_arity__85333)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__85343 = function(f, x, args) {
    var arglist__85334 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__85335 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__85334, fixed_arity__85335) <= fixed_arity__85335)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__85334))
      }else {
        return f.cljs$lang$applyTo(arglist__85334)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__85334))
    }
  };
  var apply__85344 = function(f, x, y, args) {
    var arglist__85336 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__85337 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__85336, fixed_arity__85337) <= fixed_arity__85337)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__85336))
      }else {
        return f.cljs$lang$applyTo(arglist__85336)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__85336))
    }
  };
  var apply__85345 = function(f, x, y, z, args) {
    var arglist__85338 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__85339 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__85338, fixed_arity__85339) <= fixed_arity__85339)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__85338))
      }else {
        return f.cljs$lang$applyTo(arglist__85338)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__85338))
    }
  };
  var apply__85346 = function() {
    var G__85348__delegate = function(f, a, b, c, d, args) {
      var arglist__85340 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__85341 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__85340, fixed_arity__85341) <= fixed_arity__85341)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__85340))
        }else {
          return f.cljs$lang$applyTo(arglist__85340)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__85340))
      }
    };
    var G__85348 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__85348__delegate.call(this, f, a, b, c, d, args)
    };
    G__85348.cljs$lang$maxFixedArity = 5;
    G__85348.cljs$lang$applyTo = function(arglist__85349) {
      var f = cljs.core.first(arglist__85349);
      var a = cljs.core.first(cljs.core.next(arglist__85349));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85349)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85349))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85349)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85349)))));
      return G__85348__delegate.call(this, f, a, b, c, d, args)
    };
    return G__85348
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__85342.call(this, f, a);
      case 3:
        return apply__85343.call(this, f, a, b);
      case 4:
        return apply__85344.call(this, f, a, b, c);
      case 5:
        return apply__85345.call(this, f, a, b, c, d);
      default:
        return apply__85346.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__85346.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__85350) {
    var obj = cljs.core.first(arglist__85350);
    var f = cljs.core.first(cljs.core.next(arglist__85350));
    var args = cljs.core.rest(cljs.core.next(arglist__85350));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___85351 = function(x) {
    return false
  };
  var not_EQ___85352 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___85353 = function() {
    var G__85355__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__85355 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85355__delegate.call(this, x, y, more)
    };
    G__85355.cljs$lang$maxFixedArity = 2;
    G__85355.cljs$lang$applyTo = function(arglist__85356) {
      var x = cljs.core.first(arglist__85356);
      var y = cljs.core.first(cljs.core.next(arglist__85356));
      var more = cljs.core.rest(cljs.core.next(arglist__85356));
      return G__85355__delegate.call(this, x, y, more)
    };
    return G__85355
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___85351.call(this, x);
      case 2:
        return not_EQ___85352.call(this, x, y);
      default:
        return not_EQ___85353.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___85353.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__85357 = pred;
        var G__85358 = cljs.core.next.call(null, coll);
        pred = G__85357;
        coll = G__85358;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____85359 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____85359)) {
        return or__3548__auto____85359
      }else {
        var G__85360 = pred;
        var G__85361 = cljs.core.next.call(null, coll);
        pred = G__85360;
        coll = G__85361;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__85362 = null;
    var G__85362__85363 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__85362__85364 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__85362__85365 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__85362__85366 = function() {
      var G__85368__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__85368 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__85368__delegate.call(this, x, y, zs)
      };
      G__85368.cljs$lang$maxFixedArity = 2;
      G__85368.cljs$lang$applyTo = function(arglist__85369) {
        var x = cljs.core.first(arglist__85369);
        var y = cljs.core.first(cljs.core.next(arglist__85369));
        var zs = cljs.core.rest(cljs.core.next(arglist__85369));
        return G__85368__delegate.call(this, x, y, zs)
      };
      return G__85368
    }();
    G__85362 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__85362__85363.call(this);
        case 1:
          return G__85362__85364.call(this, x);
        case 2:
          return G__85362__85365.call(this, x, y);
        default:
          return G__85362__85366.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__85362.cljs$lang$maxFixedArity = 2;
    G__85362.cljs$lang$applyTo = G__85362__85366.cljs$lang$applyTo;
    return G__85362
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__85370__delegate = function(args) {
      return x
    };
    var G__85370 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__85370__delegate.call(this, args)
    };
    G__85370.cljs$lang$maxFixedArity = 0;
    G__85370.cljs$lang$applyTo = function(arglist__85371) {
      var args = cljs.core.seq(arglist__85371);
      return G__85370__delegate.call(this, args)
    };
    return G__85370
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__85375 = function() {
    return cljs.core.identity
  };
  var comp__85376 = function(f) {
    return f
  };
  var comp__85377 = function(f, g) {
    return function() {
      var G__85381 = null;
      var G__85381__85382 = function() {
        return f.call(null, g.call(null))
      };
      var G__85381__85383 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__85381__85384 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__85381__85385 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__85381__85386 = function() {
        var G__85388__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__85388 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85388__delegate.call(this, x, y, z, args)
        };
        G__85388.cljs$lang$maxFixedArity = 3;
        G__85388.cljs$lang$applyTo = function(arglist__85389) {
          var x = cljs.core.first(arglist__85389);
          var y = cljs.core.first(cljs.core.next(arglist__85389));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85389)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85389)));
          return G__85388__delegate.call(this, x, y, z, args)
        };
        return G__85388
      }();
      G__85381 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__85381__85382.call(this);
          case 1:
            return G__85381__85383.call(this, x);
          case 2:
            return G__85381__85384.call(this, x, y);
          case 3:
            return G__85381__85385.call(this, x, y, z);
          default:
            return G__85381__85386.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__85381.cljs$lang$maxFixedArity = 3;
      G__85381.cljs$lang$applyTo = G__85381__85386.cljs$lang$applyTo;
      return G__85381
    }()
  };
  var comp__85378 = function(f, g, h) {
    return function() {
      var G__85390 = null;
      var G__85390__85391 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__85390__85392 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__85390__85393 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__85390__85394 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__85390__85395 = function() {
        var G__85397__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__85397 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85397__delegate.call(this, x, y, z, args)
        };
        G__85397.cljs$lang$maxFixedArity = 3;
        G__85397.cljs$lang$applyTo = function(arglist__85398) {
          var x = cljs.core.first(arglist__85398);
          var y = cljs.core.first(cljs.core.next(arglist__85398));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85398)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85398)));
          return G__85397__delegate.call(this, x, y, z, args)
        };
        return G__85397
      }();
      G__85390 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__85390__85391.call(this);
          case 1:
            return G__85390__85392.call(this, x);
          case 2:
            return G__85390__85393.call(this, x, y);
          case 3:
            return G__85390__85394.call(this, x, y, z);
          default:
            return G__85390__85395.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__85390.cljs$lang$maxFixedArity = 3;
      G__85390.cljs$lang$applyTo = G__85390__85395.cljs$lang$applyTo;
      return G__85390
    }()
  };
  var comp__85379 = function() {
    var G__85399__delegate = function(f1, f2, f3, fs) {
      var fs__85372 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__85400__delegate = function(args) {
          var ret__85373 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__85372), args);
          var fs__85374 = cljs.core.next.call(null, fs__85372);
          while(true) {
            if(cljs.core.truth_(fs__85374)) {
              var G__85401 = cljs.core.first.call(null, fs__85374).call(null, ret__85373);
              var G__85402 = cljs.core.next.call(null, fs__85374);
              ret__85373 = G__85401;
              fs__85374 = G__85402;
              continue
            }else {
              return ret__85373
            }
            break
          }
        };
        var G__85400 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__85400__delegate.call(this, args)
        };
        G__85400.cljs$lang$maxFixedArity = 0;
        G__85400.cljs$lang$applyTo = function(arglist__85403) {
          var args = cljs.core.seq(arglist__85403);
          return G__85400__delegate.call(this, args)
        };
        return G__85400
      }()
    };
    var G__85399 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__85399__delegate.call(this, f1, f2, f3, fs)
    };
    G__85399.cljs$lang$maxFixedArity = 3;
    G__85399.cljs$lang$applyTo = function(arglist__85404) {
      var f1 = cljs.core.first(arglist__85404);
      var f2 = cljs.core.first(cljs.core.next(arglist__85404));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85404)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85404)));
      return G__85399__delegate.call(this, f1, f2, f3, fs)
    };
    return G__85399
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__85375.call(this);
      case 1:
        return comp__85376.call(this, f1);
      case 2:
        return comp__85377.call(this, f1, f2);
      case 3:
        return comp__85378.call(this, f1, f2, f3);
      default:
        return comp__85379.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__85379.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__85405 = function(f, arg1) {
    return function() {
      var G__85410__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__85410 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__85410__delegate.call(this, args)
      };
      G__85410.cljs$lang$maxFixedArity = 0;
      G__85410.cljs$lang$applyTo = function(arglist__85411) {
        var args = cljs.core.seq(arglist__85411);
        return G__85410__delegate.call(this, args)
      };
      return G__85410
    }()
  };
  var partial__85406 = function(f, arg1, arg2) {
    return function() {
      var G__85412__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__85412 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__85412__delegate.call(this, args)
      };
      G__85412.cljs$lang$maxFixedArity = 0;
      G__85412.cljs$lang$applyTo = function(arglist__85413) {
        var args = cljs.core.seq(arglist__85413);
        return G__85412__delegate.call(this, args)
      };
      return G__85412
    }()
  };
  var partial__85407 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__85414__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__85414 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__85414__delegate.call(this, args)
      };
      G__85414.cljs$lang$maxFixedArity = 0;
      G__85414.cljs$lang$applyTo = function(arglist__85415) {
        var args = cljs.core.seq(arglist__85415);
        return G__85414__delegate.call(this, args)
      };
      return G__85414
    }()
  };
  var partial__85408 = function() {
    var G__85416__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__85417__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__85417 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__85417__delegate.call(this, args)
        };
        G__85417.cljs$lang$maxFixedArity = 0;
        G__85417.cljs$lang$applyTo = function(arglist__85418) {
          var args = cljs.core.seq(arglist__85418);
          return G__85417__delegate.call(this, args)
        };
        return G__85417
      }()
    };
    var G__85416 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__85416__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__85416.cljs$lang$maxFixedArity = 4;
    G__85416.cljs$lang$applyTo = function(arglist__85419) {
      var f = cljs.core.first(arglist__85419);
      var arg1 = cljs.core.first(cljs.core.next(arglist__85419));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85419)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85419))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85419))));
      return G__85416__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__85416
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__85405.call(this, f, arg1);
      case 3:
        return partial__85406.call(this, f, arg1, arg2);
      case 4:
        return partial__85407.call(this, f, arg1, arg2, arg3);
      default:
        return partial__85408.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__85408.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__85420 = function(f, x) {
    return function() {
      var G__85424 = null;
      var G__85424__85425 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__85424__85426 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__85424__85427 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__85424__85428 = function() {
        var G__85430__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__85430 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85430__delegate.call(this, a, b, c, ds)
        };
        G__85430.cljs$lang$maxFixedArity = 3;
        G__85430.cljs$lang$applyTo = function(arglist__85431) {
          var a = cljs.core.first(arglist__85431);
          var b = cljs.core.first(cljs.core.next(arglist__85431));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85431)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85431)));
          return G__85430__delegate.call(this, a, b, c, ds)
        };
        return G__85430
      }();
      G__85424 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__85424__85425.call(this, a);
          case 2:
            return G__85424__85426.call(this, a, b);
          case 3:
            return G__85424__85427.call(this, a, b, c);
          default:
            return G__85424__85428.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__85424.cljs$lang$maxFixedArity = 3;
      G__85424.cljs$lang$applyTo = G__85424__85428.cljs$lang$applyTo;
      return G__85424
    }()
  };
  var fnil__85421 = function(f, x, y) {
    return function() {
      var G__85432 = null;
      var G__85432__85433 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__85432__85434 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__85432__85435 = function() {
        var G__85437__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__85437 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85437__delegate.call(this, a, b, c, ds)
        };
        G__85437.cljs$lang$maxFixedArity = 3;
        G__85437.cljs$lang$applyTo = function(arglist__85438) {
          var a = cljs.core.first(arglist__85438);
          var b = cljs.core.first(cljs.core.next(arglist__85438));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85438)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85438)));
          return G__85437__delegate.call(this, a, b, c, ds)
        };
        return G__85437
      }();
      G__85432 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__85432__85433.call(this, a, b);
          case 3:
            return G__85432__85434.call(this, a, b, c);
          default:
            return G__85432__85435.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__85432.cljs$lang$maxFixedArity = 3;
      G__85432.cljs$lang$applyTo = G__85432__85435.cljs$lang$applyTo;
      return G__85432
    }()
  };
  var fnil__85422 = function(f, x, y, z) {
    return function() {
      var G__85439 = null;
      var G__85439__85440 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__85439__85441 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__85439__85442 = function() {
        var G__85444__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__85444 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85444__delegate.call(this, a, b, c, ds)
        };
        G__85444.cljs$lang$maxFixedArity = 3;
        G__85444.cljs$lang$applyTo = function(arglist__85445) {
          var a = cljs.core.first(arglist__85445);
          var b = cljs.core.first(cljs.core.next(arglist__85445));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85445)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85445)));
          return G__85444__delegate.call(this, a, b, c, ds)
        };
        return G__85444
      }();
      G__85439 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__85439__85440.call(this, a, b);
          case 3:
            return G__85439__85441.call(this, a, b, c);
          default:
            return G__85439__85442.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__85439.cljs$lang$maxFixedArity = 3;
      G__85439.cljs$lang$applyTo = G__85439__85442.cljs$lang$applyTo;
      return G__85439
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__85420.call(this, f, x);
      case 3:
        return fnil__85421.call(this, f, x, y);
      case 4:
        return fnil__85422.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__85448 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____85446 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____85446)) {
        var s__85447 = temp__3698__auto____85446;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__85447)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__85447)))
      }else {
        return null
      }
    })
  };
  return mapi__85448.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____85449 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____85449)) {
      var s__85450 = temp__3698__auto____85449;
      var x__85451 = f.call(null, cljs.core.first.call(null, s__85450));
      if(cljs.core.truth_(x__85451 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__85450))
      }else {
        return cljs.core.cons.call(null, x__85451, keep.call(null, f, cljs.core.rest.call(null, s__85450)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__85461 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____85458 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____85458)) {
        var s__85459 = temp__3698__auto____85458;
        var x__85460 = f.call(null, idx, cljs.core.first.call(null, s__85459));
        if(cljs.core.truth_(x__85460 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__85459))
        }else {
          return cljs.core.cons.call(null, x__85460, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__85459)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__85461.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__85506 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__85511 = function() {
        return true
      };
      var ep1__85512 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__85513 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____85468 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____85468)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____85468
          }
        }())
      };
      var ep1__85514 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____85469 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____85469)) {
            var and__3546__auto____85470 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____85470)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____85470
            }
          }else {
            return and__3546__auto____85469
          }
        }())
      };
      var ep1__85515 = function() {
        var G__85517__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____85471 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____85471)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____85471
            }
          }())
        };
        var G__85517 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85517__delegate.call(this, x, y, z, args)
        };
        G__85517.cljs$lang$maxFixedArity = 3;
        G__85517.cljs$lang$applyTo = function(arglist__85518) {
          var x = cljs.core.first(arglist__85518);
          var y = cljs.core.first(cljs.core.next(arglist__85518));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85518)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85518)));
          return G__85517__delegate.call(this, x, y, z, args)
        };
        return G__85517
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__85511.call(this);
          case 1:
            return ep1__85512.call(this, x);
          case 2:
            return ep1__85513.call(this, x, y);
          case 3:
            return ep1__85514.call(this, x, y, z);
          default:
            return ep1__85515.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__85515.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__85507 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__85519 = function() {
        return true
      };
      var ep2__85520 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____85472 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____85472)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____85472
          }
        }())
      };
      var ep2__85521 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____85473 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____85473)) {
            var and__3546__auto____85474 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____85474)) {
              var and__3546__auto____85475 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____85475)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____85475
              }
            }else {
              return and__3546__auto____85474
            }
          }else {
            return and__3546__auto____85473
          }
        }())
      };
      var ep2__85522 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____85476 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____85476)) {
            var and__3546__auto____85477 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____85477)) {
              var and__3546__auto____85478 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____85478)) {
                var and__3546__auto____85479 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____85479)) {
                  var and__3546__auto____85480 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____85480)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____85480
                  }
                }else {
                  return and__3546__auto____85479
                }
              }else {
                return and__3546__auto____85478
              }
            }else {
              return and__3546__auto____85477
            }
          }else {
            return and__3546__auto____85476
          }
        }())
      };
      var ep2__85523 = function() {
        var G__85525__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____85481 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____85481)) {
              return cljs.core.every_QMARK_.call(null, function(p1__85452_SHARP_) {
                var and__3546__auto____85482 = p1.call(null, p1__85452_SHARP_);
                if(cljs.core.truth_(and__3546__auto____85482)) {
                  return p2.call(null, p1__85452_SHARP_)
                }else {
                  return and__3546__auto____85482
                }
              }, args)
            }else {
              return and__3546__auto____85481
            }
          }())
        };
        var G__85525 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85525__delegate.call(this, x, y, z, args)
        };
        G__85525.cljs$lang$maxFixedArity = 3;
        G__85525.cljs$lang$applyTo = function(arglist__85526) {
          var x = cljs.core.first(arglist__85526);
          var y = cljs.core.first(cljs.core.next(arglist__85526));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85526)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85526)));
          return G__85525__delegate.call(this, x, y, z, args)
        };
        return G__85525
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__85519.call(this);
          case 1:
            return ep2__85520.call(this, x);
          case 2:
            return ep2__85521.call(this, x, y);
          case 3:
            return ep2__85522.call(this, x, y, z);
          default:
            return ep2__85523.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__85523.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__85508 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__85527 = function() {
        return true
      };
      var ep3__85528 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____85483 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____85483)) {
            var and__3546__auto____85484 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____85484)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____85484
            }
          }else {
            return and__3546__auto____85483
          }
        }())
      };
      var ep3__85529 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____85485 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____85485)) {
            var and__3546__auto____85486 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____85486)) {
              var and__3546__auto____85487 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____85487)) {
                var and__3546__auto____85488 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____85488)) {
                  var and__3546__auto____85489 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____85489)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____85489
                  }
                }else {
                  return and__3546__auto____85488
                }
              }else {
                return and__3546__auto____85487
              }
            }else {
              return and__3546__auto____85486
            }
          }else {
            return and__3546__auto____85485
          }
        }())
      };
      var ep3__85530 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____85490 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____85490)) {
            var and__3546__auto____85491 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____85491)) {
              var and__3546__auto____85492 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____85492)) {
                var and__3546__auto____85493 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____85493)) {
                  var and__3546__auto____85494 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____85494)) {
                    var and__3546__auto____85495 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____85495)) {
                      var and__3546__auto____85496 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____85496)) {
                        var and__3546__auto____85497 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____85497)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____85497
                        }
                      }else {
                        return and__3546__auto____85496
                      }
                    }else {
                      return and__3546__auto____85495
                    }
                  }else {
                    return and__3546__auto____85494
                  }
                }else {
                  return and__3546__auto____85493
                }
              }else {
                return and__3546__auto____85492
              }
            }else {
              return and__3546__auto____85491
            }
          }else {
            return and__3546__auto____85490
          }
        }())
      };
      var ep3__85531 = function() {
        var G__85533__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____85498 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____85498)) {
              return cljs.core.every_QMARK_.call(null, function(p1__85453_SHARP_) {
                var and__3546__auto____85499 = p1.call(null, p1__85453_SHARP_);
                if(cljs.core.truth_(and__3546__auto____85499)) {
                  var and__3546__auto____85500 = p2.call(null, p1__85453_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____85500)) {
                    return p3.call(null, p1__85453_SHARP_)
                  }else {
                    return and__3546__auto____85500
                  }
                }else {
                  return and__3546__auto____85499
                }
              }, args)
            }else {
              return and__3546__auto____85498
            }
          }())
        };
        var G__85533 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85533__delegate.call(this, x, y, z, args)
        };
        G__85533.cljs$lang$maxFixedArity = 3;
        G__85533.cljs$lang$applyTo = function(arglist__85534) {
          var x = cljs.core.first(arglist__85534);
          var y = cljs.core.first(cljs.core.next(arglist__85534));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85534)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85534)));
          return G__85533__delegate.call(this, x, y, z, args)
        };
        return G__85533
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__85527.call(this);
          case 1:
            return ep3__85528.call(this, x);
          case 2:
            return ep3__85529.call(this, x, y);
          case 3:
            return ep3__85530.call(this, x, y, z);
          default:
            return ep3__85531.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__85531.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__85509 = function() {
    var G__85535__delegate = function(p1, p2, p3, ps) {
      var ps__85501 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__85536 = function() {
          return true
        };
        var epn__85537 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__85454_SHARP_) {
            return p1__85454_SHARP_.call(null, x)
          }, ps__85501)
        };
        var epn__85538 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__85455_SHARP_) {
            var and__3546__auto____85502 = p1__85455_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____85502)) {
              return p1__85455_SHARP_.call(null, y)
            }else {
              return and__3546__auto____85502
            }
          }, ps__85501)
        };
        var epn__85539 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__85456_SHARP_) {
            var and__3546__auto____85503 = p1__85456_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____85503)) {
              var and__3546__auto____85504 = p1__85456_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____85504)) {
                return p1__85456_SHARP_.call(null, z)
              }else {
                return and__3546__auto____85504
              }
            }else {
              return and__3546__auto____85503
            }
          }, ps__85501)
        };
        var epn__85540 = function() {
          var G__85542__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____85505 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____85505)) {
                return cljs.core.every_QMARK_.call(null, function(p1__85457_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__85457_SHARP_, args)
                }, ps__85501)
              }else {
                return and__3546__auto____85505
              }
            }())
          };
          var G__85542 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__85542__delegate.call(this, x, y, z, args)
          };
          G__85542.cljs$lang$maxFixedArity = 3;
          G__85542.cljs$lang$applyTo = function(arglist__85543) {
            var x = cljs.core.first(arglist__85543);
            var y = cljs.core.first(cljs.core.next(arglist__85543));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85543)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85543)));
            return G__85542__delegate.call(this, x, y, z, args)
          };
          return G__85542
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__85536.call(this);
            case 1:
              return epn__85537.call(this, x);
            case 2:
              return epn__85538.call(this, x, y);
            case 3:
              return epn__85539.call(this, x, y, z);
            default:
              return epn__85540.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__85540.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__85535 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__85535__delegate.call(this, p1, p2, p3, ps)
    };
    G__85535.cljs$lang$maxFixedArity = 3;
    G__85535.cljs$lang$applyTo = function(arglist__85544) {
      var p1 = cljs.core.first(arglist__85544);
      var p2 = cljs.core.first(cljs.core.next(arglist__85544));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85544)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85544)));
      return G__85535__delegate.call(this, p1, p2, p3, ps)
    };
    return G__85535
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__85506.call(this, p1);
      case 2:
        return every_pred__85507.call(this, p1, p2);
      case 3:
        return every_pred__85508.call(this, p1, p2, p3);
      default:
        return every_pred__85509.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__85509.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__85584 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__85589 = function() {
        return null
      };
      var sp1__85590 = function(x) {
        return p.call(null, x)
      };
      var sp1__85591 = function(x, y) {
        var or__3548__auto____85546 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____85546)) {
          return or__3548__auto____85546
        }else {
          return p.call(null, y)
        }
      };
      var sp1__85592 = function(x, y, z) {
        var or__3548__auto____85547 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____85547)) {
          return or__3548__auto____85547
        }else {
          var or__3548__auto____85548 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____85548)) {
            return or__3548__auto____85548
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__85593 = function() {
        var G__85595__delegate = function(x, y, z, args) {
          var or__3548__auto____85549 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____85549)) {
            return or__3548__auto____85549
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__85595 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85595__delegate.call(this, x, y, z, args)
        };
        G__85595.cljs$lang$maxFixedArity = 3;
        G__85595.cljs$lang$applyTo = function(arglist__85596) {
          var x = cljs.core.first(arglist__85596);
          var y = cljs.core.first(cljs.core.next(arglist__85596));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85596)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85596)));
          return G__85595__delegate.call(this, x, y, z, args)
        };
        return G__85595
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__85589.call(this);
          case 1:
            return sp1__85590.call(this, x);
          case 2:
            return sp1__85591.call(this, x, y);
          case 3:
            return sp1__85592.call(this, x, y, z);
          default:
            return sp1__85593.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__85593.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__85585 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__85597 = function() {
        return null
      };
      var sp2__85598 = function(x) {
        var or__3548__auto____85550 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____85550)) {
          return or__3548__auto____85550
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__85599 = function(x, y) {
        var or__3548__auto____85551 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____85551)) {
          return or__3548__auto____85551
        }else {
          var or__3548__auto____85552 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____85552)) {
            return or__3548__auto____85552
          }else {
            var or__3548__auto____85553 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____85553)) {
              return or__3548__auto____85553
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__85600 = function(x, y, z) {
        var or__3548__auto____85554 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____85554)) {
          return or__3548__auto____85554
        }else {
          var or__3548__auto____85555 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____85555)) {
            return or__3548__auto____85555
          }else {
            var or__3548__auto____85556 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____85556)) {
              return or__3548__auto____85556
            }else {
              var or__3548__auto____85557 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____85557)) {
                return or__3548__auto____85557
              }else {
                var or__3548__auto____85558 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____85558)) {
                  return or__3548__auto____85558
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__85601 = function() {
        var G__85603__delegate = function(x, y, z, args) {
          var or__3548__auto____85559 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____85559)) {
            return or__3548__auto____85559
          }else {
            return cljs.core.some.call(null, function(p1__85462_SHARP_) {
              var or__3548__auto____85560 = p1.call(null, p1__85462_SHARP_);
              if(cljs.core.truth_(or__3548__auto____85560)) {
                return or__3548__auto____85560
              }else {
                return p2.call(null, p1__85462_SHARP_)
              }
            }, args)
          }
        };
        var G__85603 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85603__delegate.call(this, x, y, z, args)
        };
        G__85603.cljs$lang$maxFixedArity = 3;
        G__85603.cljs$lang$applyTo = function(arglist__85604) {
          var x = cljs.core.first(arglist__85604);
          var y = cljs.core.first(cljs.core.next(arglist__85604));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85604)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85604)));
          return G__85603__delegate.call(this, x, y, z, args)
        };
        return G__85603
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__85597.call(this);
          case 1:
            return sp2__85598.call(this, x);
          case 2:
            return sp2__85599.call(this, x, y);
          case 3:
            return sp2__85600.call(this, x, y, z);
          default:
            return sp2__85601.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__85601.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__85586 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__85605 = function() {
        return null
      };
      var sp3__85606 = function(x) {
        var or__3548__auto____85561 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____85561)) {
          return or__3548__auto____85561
        }else {
          var or__3548__auto____85562 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____85562)) {
            return or__3548__auto____85562
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__85607 = function(x, y) {
        var or__3548__auto____85563 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____85563)) {
          return or__3548__auto____85563
        }else {
          var or__3548__auto____85564 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____85564)) {
            return or__3548__auto____85564
          }else {
            var or__3548__auto____85565 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____85565)) {
              return or__3548__auto____85565
            }else {
              var or__3548__auto____85566 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____85566)) {
                return or__3548__auto____85566
              }else {
                var or__3548__auto____85567 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____85567)) {
                  return or__3548__auto____85567
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__85608 = function(x, y, z) {
        var or__3548__auto____85568 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____85568)) {
          return or__3548__auto____85568
        }else {
          var or__3548__auto____85569 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____85569)) {
            return or__3548__auto____85569
          }else {
            var or__3548__auto____85570 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____85570)) {
              return or__3548__auto____85570
            }else {
              var or__3548__auto____85571 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____85571)) {
                return or__3548__auto____85571
              }else {
                var or__3548__auto____85572 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____85572)) {
                  return or__3548__auto____85572
                }else {
                  var or__3548__auto____85573 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____85573)) {
                    return or__3548__auto____85573
                  }else {
                    var or__3548__auto____85574 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____85574)) {
                      return or__3548__auto____85574
                    }else {
                      var or__3548__auto____85575 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____85575)) {
                        return or__3548__auto____85575
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__85609 = function() {
        var G__85611__delegate = function(x, y, z, args) {
          var or__3548__auto____85576 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____85576)) {
            return or__3548__auto____85576
          }else {
            return cljs.core.some.call(null, function(p1__85463_SHARP_) {
              var or__3548__auto____85577 = p1.call(null, p1__85463_SHARP_);
              if(cljs.core.truth_(or__3548__auto____85577)) {
                return or__3548__auto____85577
              }else {
                var or__3548__auto____85578 = p2.call(null, p1__85463_SHARP_);
                if(cljs.core.truth_(or__3548__auto____85578)) {
                  return or__3548__auto____85578
                }else {
                  return p3.call(null, p1__85463_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__85611 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__85611__delegate.call(this, x, y, z, args)
        };
        G__85611.cljs$lang$maxFixedArity = 3;
        G__85611.cljs$lang$applyTo = function(arglist__85612) {
          var x = cljs.core.first(arglist__85612);
          var y = cljs.core.first(cljs.core.next(arglist__85612));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85612)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85612)));
          return G__85611__delegate.call(this, x, y, z, args)
        };
        return G__85611
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__85605.call(this);
          case 1:
            return sp3__85606.call(this, x);
          case 2:
            return sp3__85607.call(this, x, y);
          case 3:
            return sp3__85608.call(this, x, y, z);
          default:
            return sp3__85609.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__85609.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__85587 = function() {
    var G__85613__delegate = function(p1, p2, p3, ps) {
      var ps__85579 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__85614 = function() {
          return null
        };
        var spn__85615 = function(x) {
          return cljs.core.some.call(null, function(p1__85464_SHARP_) {
            return p1__85464_SHARP_.call(null, x)
          }, ps__85579)
        };
        var spn__85616 = function(x, y) {
          return cljs.core.some.call(null, function(p1__85465_SHARP_) {
            var or__3548__auto____85580 = p1__85465_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____85580)) {
              return or__3548__auto____85580
            }else {
              return p1__85465_SHARP_.call(null, y)
            }
          }, ps__85579)
        };
        var spn__85617 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__85466_SHARP_) {
            var or__3548__auto____85581 = p1__85466_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____85581)) {
              return or__3548__auto____85581
            }else {
              var or__3548__auto____85582 = p1__85466_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____85582)) {
                return or__3548__auto____85582
              }else {
                return p1__85466_SHARP_.call(null, z)
              }
            }
          }, ps__85579)
        };
        var spn__85618 = function() {
          var G__85620__delegate = function(x, y, z, args) {
            var or__3548__auto____85583 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____85583)) {
              return or__3548__auto____85583
            }else {
              return cljs.core.some.call(null, function(p1__85467_SHARP_) {
                return cljs.core.some.call(null, p1__85467_SHARP_, args)
              }, ps__85579)
            }
          };
          var G__85620 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__85620__delegate.call(this, x, y, z, args)
          };
          G__85620.cljs$lang$maxFixedArity = 3;
          G__85620.cljs$lang$applyTo = function(arglist__85621) {
            var x = cljs.core.first(arglist__85621);
            var y = cljs.core.first(cljs.core.next(arglist__85621));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85621)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85621)));
            return G__85620__delegate.call(this, x, y, z, args)
          };
          return G__85620
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__85614.call(this);
            case 1:
              return spn__85615.call(this, x);
            case 2:
              return spn__85616.call(this, x, y);
            case 3:
              return spn__85617.call(this, x, y, z);
            default:
              return spn__85618.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__85618.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__85613 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__85613__delegate.call(this, p1, p2, p3, ps)
    };
    G__85613.cljs$lang$maxFixedArity = 3;
    G__85613.cljs$lang$applyTo = function(arglist__85622) {
      var p1 = cljs.core.first(arglist__85622);
      var p2 = cljs.core.first(cljs.core.next(arglist__85622));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85622)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85622)));
      return G__85613__delegate.call(this, p1, p2, p3, ps)
    };
    return G__85613
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__85584.call(this, p1);
      case 2:
        return some_fn__85585.call(this, p1, p2);
      case 3:
        return some_fn__85586.call(this, p1, p2, p3);
      default:
        return some_fn__85587.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__85587.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__85635 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____85623 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____85623)) {
        var s__85624 = temp__3698__auto____85623;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__85624)), map.call(null, f, cljs.core.rest.call(null, s__85624)))
      }else {
        return null
      }
    })
  };
  var map__85636 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__85625 = cljs.core.seq.call(null, c1);
      var s2__85626 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____85627 = s1__85625;
        if(cljs.core.truth_(and__3546__auto____85627)) {
          return s2__85626
        }else {
          return and__3546__auto____85627
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__85625), cljs.core.first.call(null, s2__85626)), map.call(null, f, cljs.core.rest.call(null, s1__85625), cljs.core.rest.call(null, s2__85626)))
      }else {
        return null
      }
    })
  };
  var map__85637 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__85628 = cljs.core.seq.call(null, c1);
      var s2__85629 = cljs.core.seq.call(null, c2);
      var s3__85630 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____85631 = s1__85628;
        if(cljs.core.truth_(and__3546__auto____85631)) {
          var and__3546__auto____85632 = s2__85629;
          if(cljs.core.truth_(and__3546__auto____85632)) {
            return s3__85630
          }else {
            return and__3546__auto____85632
          }
        }else {
          return and__3546__auto____85631
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__85628), cljs.core.first.call(null, s2__85629), cljs.core.first.call(null, s3__85630)), map.call(null, f, cljs.core.rest.call(null, s1__85628), cljs.core.rest.call(null, s2__85629), cljs.core.rest.call(null, s3__85630)))
      }else {
        return null
      }
    })
  };
  var map__85638 = function() {
    var G__85640__delegate = function(f, c1, c2, c3, colls) {
      var step__85634 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__85633 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__85633))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__85633), step.call(null, map.call(null, cljs.core.rest, ss__85633)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__85545_SHARP_) {
        return cljs.core.apply.call(null, f, p1__85545_SHARP_)
      }, step__85634.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__85640 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__85640__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__85640.cljs$lang$maxFixedArity = 4;
    G__85640.cljs$lang$applyTo = function(arglist__85641) {
      var f = cljs.core.first(arglist__85641);
      var c1 = cljs.core.first(cljs.core.next(arglist__85641));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85641)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85641))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__85641))));
      return G__85640__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__85640
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__85635.call(this, f, c1);
      case 3:
        return map__85636.call(this, f, c1, c2);
      case 4:
        return map__85637.call(this, f, c1, c2, c3);
      default:
        return map__85638.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__85638.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____85642 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____85642)) {
        var s__85643 = temp__3698__auto____85642;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__85643), take.call(null, n - 1, cljs.core.rest.call(null, s__85643)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__85646 = function(n, coll) {
    while(true) {
      var s__85644 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____85645 = n > 0;
        if(cljs.core.truth_(and__3546__auto____85645)) {
          return s__85644
        }else {
          return and__3546__auto____85645
        }
      }())) {
        var G__85647 = n - 1;
        var G__85648 = cljs.core.rest.call(null, s__85644);
        n = G__85647;
        coll = G__85648;
        continue
      }else {
        return s__85644
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__85646.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__85649 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__85650 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__85649.call(this, n);
      case 2:
        return drop_last__85650.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__85652 = cljs.core.seq.call(null, coll);
  var lead__85653 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__85653)) {
      var G__85654 = cljs.core.next.call(null, s__85652);
      var G__85655 = cljs.core.next.call(null, lead__85653);
      s__85652 = G__85654;
      lead__85653 = G__85655;
      continue
    }else {
      return s__85652
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__85658 = function(pred, coll) {
    while(true) {
      var s__85656 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____85657 = s__85656;
        if(cljs.core.truth_(and__3546__auto____85657)) {
          return pred.call(null, cljs.core.first.call(null, s__85656))
        }else {
          return and__3546__auto____85657
        }
      }())) {
        var G__85659 = pred;
        var G__85660 = cljs.core.rest.call(null, s__85656);
        pred = G__85659;
        coll = G__85660;
        continue
      }else {
        return s__85656
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__85658.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____85661 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____85661)) {
      var s__85662 = temp__3698__auto____85661;
      return cljs.core.concat.call(null, s__85662, cycle.call(null, s__85662))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__85663 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__85664 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__85663.call(this, n);
      case 2:
        return repeat__85664.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__85666 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__85667 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__85666.call(this, n);
      case 2:
        return repeatedly__85667.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__85673 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__85669 = cljs.core.seq.call(null, c1);
      var s2__85670 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____85671 = s1__85669;
        if(cljs.core.truth_(and__3546__auto____85671)) {
          return s2__85670
        }else {
          return and__3546__auto____85671
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__85669), cljs.core.cons.call(null, cljs.core.first.call(null, s2__85670), interleave.call(null, cljs.core.rest.call(null, s1__85669), cljs.core.rest.call(null, s2__85670))))
      }else {
        return null
      }
    })
  };
  var interleave__85674 = function() {
    var G__85676__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__85672 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__85672))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__85672), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__85672)))
        }else {
          return null
        }
      })
    };
    var G__85676 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85676__delegate.call(this, c1, c2, colls)
    };
    G__85676.cljs$lang$maxFixedArity = 2;
    G__85676.cljs$lang$applyTo = function(arglist__85677) {
      var c1 = cljs.core.first(arglist__85677);
      var c2 = cljs.core.first(cljs.core.next(arglist__85677));
      var colls = cljs.core.rest(cljs.core.next(arglist__85677));
      return G__85676__delegate.call(this, c1, c2, colls)
    };
    return G__85676
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__85673.call(this, c1, c2);
      default:
        return interleave__85674.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__85674.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__85680 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____85678 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____85678)) {
        var coll__85679 = temp__3695__auto____85678;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__85679), cat.call(null, cljs.core.rest.call(null, coll__85679), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__85680.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__85681 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__85682 = function() {
    var G__85684__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__85684 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__85684__delegate.call(this, f, coll, colls)
    };
    G__85684.cljs$lang$maxFixedArity = 2;
    G__85684.cljs$lang$applyTo = function(arglist__85685) {
      var f = cljs.core.first(arglist__85685);
      var coll = cljs.core.first(cljs.core.next(arglist__85685));
      var colls = cljs.core.rest(cljs.core.next(arglist__85685));
      return G__85684__delegate.call(this, f, coll, colls)
    };
    return G__85684
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__85681.call(this, f, coll);
      default:
        return mapcat__85682.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__85682.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____85686 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____85686)) {
      var s__85687 = temp__3698__auto____85686;
      var f__85688 = cljs.core.first.call(null, s__85687);
      var r__85689 = cljs.core.rest.call(null, s__85687);
      if(cljs.core.truth_(pred.call(null, f__85688))) {
        return cljs.core.cons.call(null, f__85688, filter.call(null, pred, r__85689))
      }else {
        return filter.call(null, pred, r__85689)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__85691 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__85691.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__85690_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__85690_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__85698 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__85699 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____85692 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____85692)) {
        var s__85693 = temp__3698__auto____85692;
        var p__85694 = cljs.core.take.call(null, n, s__85693);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__85694)))) {
          return cljs.core.cons.call(null, p__85694, partition.call(null, n, step, cljs.core.drop.call(null, step, s__85693)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__85700 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____85695 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____85695)) {
        var s__85696 = temp__3698__auto____85695;
        var p__85697 = cljs.core.take.call(null, n, s__85696);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__85697)))) {
          return cljs.core.cons.call(null, p__85697, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__85696)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__85697, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__85698.call(this, n, step);
      case 3:
        return partition__85699.call(this, n, step, pad);
      case 4:
        return partition__85700.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__85706 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__85707 = function(m, ks, not_found) {
    var sentinel__85702 = cljs.core.lookup_sentinel;
    var m__85703 = m;
    var ks__85704 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__85704)) {
        var m__85705 = cljs.core.get.call(null, m__85703, cljs.core.first.call(null, ks__85704), sentinel__85702);
        if(cljs.core.truth_(sentinel__85702 === m__85705)) {
          return not_found
        }else {
          var G__85709 = sentinel__85702;
          var G__85710 = m__85705;
          var G__85711 = cljs.core.next.call(null, ks__85704);
          sentinel__85702 = G__85709;
          m__85703 = G__85710;
          ks__85704 = G__85711;
          continue
        }
      }else {
        return m__85703
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__85706.call(this, m, ks);
      case 3:
        return get_in__85707.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__85712, v) {
  var vec__85713__85714 = p__85712;
  var k__85715 = cljs.core.nth.call(null, vec__85713__85714, 0, null);
  var ks__85716 = cljs.core.nthnext.call(null, vec__85713__85714, 1);
  if(cljs.core.truth_(ks__85716)) {
    return cljs.core.assoc.call(null, m, k__85715, assoc_in.call(null, cljs.core.get.call(null, m, k__85715), ks__85716, v))
  }else {
    return cljs.core.assoc.call(null, m, k__85715, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__85717, f, args) {
    var vec__85718__85719 = p__85717;
    var k__85720 = cljs.core.nth.call(null, vec__85718__85719, 0, null);
    var ks__85721 = cljs.core.nthnext.call(null, vec__85718__85719, 1);
    if(cljs.core.truth_(ks__85721)) {
      return cljs.core.assoc.call(null, m, k__85720, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__85720), ks__85721, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__85720, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__85720), args))
    }
  };
  var update_in = function(m, p__85717, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__85717, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__85722) {
    var m = cljs.core.first(arglist__85722);
    var p__85717 = cljs.core.first(cljs.core.next(arglist__85722));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__85722)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__85722)));
    return update_in__delegate.call(this, m, p__85717, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85723 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__85756 = null;
  var G__85756__85757 = function(coll, k) {
    var this__85724 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__85756__85758 = function(coll, k, not_found) {
    var this__85725 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__85756 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85756__85757.call(this, coll, k);
      case 3:
        return G__85756__85758.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85756
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__85726 = this;
  var new_array__85727 = cljs.core.aclone.call(null, this__85726.array);
  new_array__85727[k] = v;
  return new cljs.core.Vector(this__85726.meta, new_array__85727)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__85760 = null;
  var G__85760__85761 = function(tsym85728, k) {
    var this__85730 = this;
    var tsym85728__85731 = this;
    var coll__85732 = tsym85728__85731;
    return cljs.core._lookup.call(null, coll__85732, k)
  };
  var G__85760__85762 = function(tsym85729, k, not_found) {
    var this__85733 = this;
    var tsym85729__85734 = this;
    var coll__85735 = tsym85729__85734;
    return cljs.core._lookup.call(null, coll__85735, k, not_found)
  };
  G__85760 = function(tsym85729, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85760__85761.call(this, tsym85729, k);
      case 3:
        return G__85760__85762.call(this, tsym85729, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85760
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85736 = this;
  var new_array__85737 = cljs.core.aclone.call(null, this__85736.array);
  new_array__85737.push(o);
  return new cljs.core.Vector(this__85736.meta, new_array__85737)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__85764 = null;
  var G__85764__85765 = function(v, f) {
    var this__85738 = this;
    return cljs.core.ci_reduce.call(null, this__85738.array, f)
  };
  var G__85764__85766 = function(v, f, start) {
    var this__85739 = this;
    return cljs.core.ci_reduce.call(null, this__85739.array, f, start)
  };
  G__85764 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__85764__85765.call(this, v, f);
      case 3:
        return G__85764__85766.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85764
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85740 = this;
  if(cljs.core.truth_(this__85740.array.length > 0)) {
    var vector_seq__85741 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__85740.array.length)) {
          return cljs.core.cons.call(null, this__85740.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__85741.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__85742 = this;
  return this__85742.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__85743 = this;
  var count__85744 = this__85743.array.length;
  if(cljs.core.truth_(count__85744 > 0)) {
    return this__85743.array[count__85744 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__85745 = this;
  if(cljs.core.truth_(this__85745.array.length > 0)) {
    var new_array__85746 = cljs.core.aclone.call(null, this__85745.array);
    new_array__85746.pop();
    return new cljs.core.Vector(this__85745.meta, new_array__85746)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__85747 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85748 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85749 = this;
  return new cljs.core.Vector(meta, this__85749.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85750 = this;
  return this__85750.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__85768 = null;
  var G__85768__85769 = function(coll, n) {
    var this__85751 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____85752 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____85752)) {
        return n < this__85751.array.length
      }else {
        return and__3546__auto____85752
      }
    }())) {
      return this__85751.array[n]
    }else {
      return null
    }
  };
  var G__85768__85770 = function(coll, n, not_found) {
    var this__85753 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____85754 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____85754)) {
        return n < this__85753.array.length
      }else {
        return and__3546__auto____85754
      }
    }())) {
      return this__85753.array[n]
    }else {
      return not_found
    }
  };
  G__85768 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85768__85769.call(this, coll, n);
      case 3:
        return G__85768__85770.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85768
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85755 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__85755.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, cljs.core.array.call(null));
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.Vector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__85772) {
    var args = cljs.core.seq(arglist__85772);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85773 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__85801 = null;
  var G__85801__85802 = function(coll, k) {
    var this__85774 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__85801__85803 = function(coll, k, not_found) {
    var this__85775 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__85801 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85801__85802.call(this, coll, k);
      case 3:
        return G__85801__85803.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85801
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__85776 = this;
  var v_pos__85777 = this__85776.start + key;
  return new cljs.core.Subvec(this__85776.meta, cljs.core._assoc.call(null, this__85776.v, v_pos__85777, val), this__85776.start, this__85776.end > v_pos__85777 + 1 ? this__85776.end : v_pos__85777 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__85805 = null;
  var G__85805__85806 = function(tsym85778, k) {
    var this__85780 = this;
    var tsym85778__85781 = this;
    var coll__85782 = tsym85778__85781;
    return cljs.core._lookup.call(null, coll__85782, k)
  };
  var G__85805__85807 = function(tsym85779, k, not_found) {
    var this__85783 = this;
    var tsym85779__85784 = this;
    var coll__85785 = tsym85779__85784;
    return cljs.core._lookup.call(null, coll__85785, k, not_found)
  };
  G__85805 = function(tsym85779, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85805__85806.call(this, tsym85779, k);
      case 3:
        return G__85805__85807.call(this, tsym85779, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85805
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85786 = this;
  return new cljs.core.Subvec(this__85786.meta, cljs.core._assoc_n.call(null, this__85786.v, this__85786.end, o), this__85786.start, this__85786.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__85809 = null;
  var G__85809__85810 = function(coll, f) {
    var this__85787 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__85809__85811 = function(coll, f, start) {
    var this__85788 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__85809 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__85809__85810.call(this, coll, f);
      case 3:
        return G__85809__85811.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85809
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85789 = this;
  var subvec_seq__85790 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__85789.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__85789.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__85790.call(null, this__85789.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__85791 = this;
  return this__85791.end - this__85791.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__85792 = this;
  return cljs.core._nth.call(null, this__85792.v, this__85792.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__85793 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__85793.start, this__85793.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__85793.meta, this__85793.v, this__85793.start, this__85793.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__85794 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85795 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85796 = this;
  return new cljs.core.Subvec(meta, this__85796.v, this__85796.start, this__85796.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85797 = this;
  return this__85797.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__85813 = null;
  var G__85813__85814 = function(coll, n) {
    var this__85798 = this;
    return cljs.core._nth.call(null, this__85798.v, this__85798.start + n)
  };
  var G__85813__85815 = function(coll, n, not_found) {
    var this__85799 = this;
    return cljs.core._nth.call(null, this__85799.v, this__85799.start + n, not_found)
  };
  G__85813 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85813__85814.call(this, coll, n);
      case 3:
        return G__85813__85815.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85813
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85800 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__85800.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__85817 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__85818 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__85817.call(this, v, start);
      case 3:
        return subvec__85818.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85820 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85821 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85822 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85823 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__85823.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85824 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__85825 = this;
  return cljs.core._first.call(null, this__85825.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__85826 = this;
  var temp__3695__auto____85827 = cljs.core.next.call(null, this__85826.front);
  if(cljs.core.truth_(temp__3695__auto____85827)) {
    var f1__85828 = temp__3695__auto____85827;
    return new cljs.core.PersistentQueueSeq(this__85826.meta, f1__85828, this__85826.rear)
  }else {
    if(cljs.core.truth_(this__85826.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__85826.meta, this__85826.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85829 = this;
  return this__85829.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85830 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__85830.front, this__85830.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85831 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85832 = this;
  if(cljs.core.truth_(this__85832.front)) {
    return new cljs.core.PersistentQueue(this__85832.meta, this__85832.count + 1, this__85832.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____85833 = this__85832.rear;
      if(cljs.core.truth_(or__3548__auto____85833)) {
        return or__3548__auto____85833
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__85832.meta, this__85832.count + 1, cljs.core.conj.call(null, this__85832.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85834 = this;
  var rear__85835 = cljs.core.seq.call(null, this__85834.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____85836 = this__85834.front;
    if(cljs.core.truth_(or__3548__auto____85836)) {
      return or__3548__auto____85836
    }else {
      return rear__85835
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__85834.front, cljs.core.seq.call(null, rear__85835))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__85837 = this;
  return this__85837.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__85838 = this;
  return cljs.core._first.call(null, this__85838.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__85839 = this;
  if(cljs.core.truth_(this__85839.front)) {
    var temp__3695__auto____85840 = cljs.core.next.call(null, this__85839.front);
    if(cljs.core.truth_(temp__3695__auto____85840)) {
      var f1__85841 = temp__3695__auto____85840;
      return new cljs.core.PersistentQueue(this__85839.meta, this__85839.count - 1, f1__85841, this__85839.rear)
    }else {
      return new cljs.core.PersistentQueue(this__85839.meta, this__85839.count - 1, cljs.core.seq.call(null, this__85839.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__85842 = this;
  return cljs.core.first.call(null, this__85842.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__85843 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85844 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85845 = this;
  return new cljs.core.PersistentQueue(meta, this__85845.count, this__85845.front, this__85845.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85846 = this;
  return this__85846.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85847 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.Vector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__85848 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__85849 = array.length;
  var i__85850 = 0;
  while(true) {
    if(cljs.core.truth_(i__85850 < len__85849)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__85850]))) {
        return i__85850
      }else {
        var G__85851 = i__85850 + incr;
        i__85850 = G__85851;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___85853 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___85854 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____85852 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____85852)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____85852
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___85853.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___85854.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__85857 = cljs.core.hash.call(null, a);
  var b__85858 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__85857 < b__85858)) {
    return-1
  }else {
    if(cljs.core.truth_(a__85857 > b__85858)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85859 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__85886 = null;
  var G__85886__85887 = function(coll, k) {
    var this__85860 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__85886__85888 = function(coll, k, not_found) {
    var this__85861 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__85861.strobj, this__85861.strobj[k], not_found)
  };
  G__85886 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85886__85887.call(this, coll, k);
      case 3:
        return G__85886__85888.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85886
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__85862 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__85863 = goog.object.clone.call(null, this__85862.strobj);
    var overwrite_QMARK___85864 = new_strobj__85863.hasOwnProperty(k);
    new_strobj__85863[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___85864)) {
      return new cljs.core.ObjMap(this__85862.meta, this__85862.keys, new_strobj__85863)
    }else {
      var new_keys__85865 = cljs.core.aclone.call(null, this__85862.keys);
      new_keys__85865.push(k);
      return new cljs.core.ObjMap(this__85862.meta, new_keys__85865, new_strobj__85863)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__85862.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__85866 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__85866.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__85890 = null;
  var G__85890__85891 = function(tsym85867, k) {
    var this__85869 = this;
    var tsym85867__85870 = this;
    var coll__85871 = tsym85867__85870;
    return cljs.core._lookup.call(null, coll__85871, k)
  };
  var G__85890__85892 = function(tsym85868, k, not_found) {
    var this__85872 = this;
    var tsym85868__85873 = this;
    var coll__85874 = tsym85868__85873;
    return cljs.core._lookup.call(null, coll__85874, k, not_found)
  };
  G__85890 = function(tsym85868, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85890__85891.call(this, tsym85868, k);
      case 3:
        return G__85890__85892.call(this, tsym85868, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85890
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__85875 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85876 = this;
  if(cljs.core.truth_(this__85876.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__85856_SHARP_) {
      return cljs.core.vector.call(null, p1__85856_SHARP_, this__85876.strobj[p1__85856_SHARP_])
    }, this__85876.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__85877 = this;
  return this__85877.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85878 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85879 = this;
  return new cljs.core.ObjMap(meta, this__85879.keys, this__85879.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85880 = this;
  return this__85880.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85881 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__85881.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__85882 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____85883 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____85883)) {
      return this__85882.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____85883
    }
  }())) {
    var new_keys__85884 = cljs.core.aclone.call(null, this__85882.keys);
    var new_strobj__85885 = goog.object.clone.call(null, this__85882.strobj);
    new_keys__85884.splice(cljs.core.scan_array.call(null, 1, k, new_keys__85884), 1);
    cljs.core.js_delete.call(null, new_strobj__85885, k);
    return new cljs.core.ObjMap(this__85882.meta, new_keys__85884, new_strobj__85885)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, cljs.core.array.call(null), cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85895 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__85933 = null;
  var G__85933__85934 = function(coll, k) {
    var this__85896 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__85933__85935 = function(coll, k, not_found) {
    var this__85897 = this;
    var bucket__85898 = this__85897.hashobj[cljs.core.hash.call(null, k)];
    var i__85899 = cljs.core.truth_(bucket__85898) ? cljs.core.scan_array.call(null, 2, k, bucket__85898) : null;
    if(cljs.core.truth_(i__85899)) {
      return bucket__85898[i__85899 + 1]
    }else {
      return not_found
    }
  };
  G__85933 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85933__85934.call(this, coll, k);
      case 3:
        return G__85933__85935.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85933
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__85900 = this;
  var h__85901 = cljs.core.hash.call(null, k);
  var bucket__85902 = this__85900.hashobj[h__85901];
  if(cljs.core.truth_(bucket__85902)) {
    var new_bucket__85903 = cljs.core.aclone.call(null, bucket__85902);
    var new_hashobj__85904 = goog.object.clone.call(null, this__85900.hashobj);
    new_hashobj__85904[h__85901] = new_bucket__85903;
    var temp__3695__auto____85905 = cljs.core.scan_array.call(null, 2, k, new_bucket__85903);
    if(cljs.core.truth_(temp__3695__auto____85905)) {
      var i__85906 = temp__3695__auto____85905;
      new_bucket__85903[i__85906 + 1] = v;
      return new cljs.core.HashMap(this__85900.meta, this__85900.count, new_hashobj__85904)
    }else {
      new_bucket__85903.push(k, v);
      return new cljs.core.HashMap(this__85900.meta, this__85900.count + 1, new_hashobj__85904)
    }
  }else {
    var new_hashobj__85907 = goog.object.clone.call(null, this__85900.hashobj);
    new_hashobj__85907[h__85901] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__85900.meta, this__85900.count + 1, new_hashobj__85907)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__85908 = this;
  var bucket__85909 = this__85908.hashobj[cljs.core.hash.call(null, k)];
  var i__85910 = cljs.core.truth_(bucket__85909) ? cljs.core.scan_array.call(null, 2, k, bucket__85909) : null;
  if(cljs.core.truth_(i__85910)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__85937 = null;
  var G__85937__85938 = function(tsym85911, k) {
    var this__85913 = this;
    var tsym85911__85914 = this;
    var coll__85915 = tsym85911__85914;
    return cljs.core._lookup.call(null, coll__85915, k)
  };
  var G__85937__85939 = function(tsym85912, k, not_found) {
    var this__85916 = this;
    var tsym85912__85917 = this;
    var coll__85918 = tsym85912__85917;
    return cljs.core._lookup.call(null, coll__85918, k, not_found)
  };
  G__85937 = function(tsym85912, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85937__85938.call(this, tsym85912, k);
      case 3:
        return G__85937__85939.call(this, tsym85912, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85937
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__85919 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85920 = this;
  if(cljs.core.truth_(this__85920.count > 0)) {
    var hashes__85921 = cljs.core.js_keys.call(null, this__85920.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__85894_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__85920.hashobj[p1__85894_SHARP_]))
    }, hashes__85921)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__85922 = this;
  return this__85922.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85923 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85924 = this;
  return new cljs.core.HashMap(meta, this__85924.count, this__85924.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85925 = this;
  return this__85925.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85926 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__85926.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__85927 = this;
  var h__85928 = cljs.core.hash.call(null, k);
  var bucket__85929 = this__85927.hashobj[h__85928];
  var i__85930 = cljs.core.truth_(bucket__85929) ? cljs.core.scan_array.call(null, 2, k, bucket__85929) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__85930))) {
    return coll
  }else {
    var new_hashobj__85931 = goog.object.clone.call(null, this__85927.hashobj);
    if(cljs.core.truth_(3 > bucket__85929.length)) {
      cljs.core.js_delete.call(null, new_hashobj__85931, h__85928)
    }else {
      var new_bucket__85932 = cljs.core.aclone.call(null, bucket__85929);
      new_bucket__85932.splice(i__85930, 2);
      new_hashobj__85931[h__85928] = new_bucket__85932
    }
    return new cljs.core.HashMap(this__85927.meta, this__85927.count - 1, new_hashobj__85931)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__85941 = ks.length;
  var i__85942 = 0;
  var out__85943 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__85942 < len__85941)) {
      var G__85944 = i__85942 + 1;
      var G__85945 = cljs.core.assoc.call(null, out__85943, ks[i__85942], vs[i__85942]);
      i__85942 = G__85944;
      out__85943 = G__85945;
      continue
    }else {
      return out__85943
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__85946 = cljs.core.seq.call(null, keyvals);
    var out__85947 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__85946)) {
        var G__85948 = cljs.core.nnext.call(null, in$__85946);
        var G__85949 = cljs.core.assoc.call(null, out__85947, cljs.core.first.call(null, in$__85946), cljs.core.second.call(null, in$__85946));
        in$__85946 = G__85948;
        out__85947 = G__85949;
        continue
      }else {
        return out__85947
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__85950) {
    var keyvals = cljs.core.seq(arglist__85950);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__85951_SHARP_, p2__85952_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____85953 = p1__85951_SHARP_;
          if(cljs.core.truth_(or__3548__auto____85953)) {
            return or__3548__auto____85953
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__85952_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__85954) {
    var maps = cljs.core.seq(arglist__85954);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__85957 = function(m, e) {
        var k__85955 = cljs.core.first.call(null, e);
        var v__85956 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__85955))) {
          return cljs.core.assoc.call(null, m, k__85955, f.call(null, cljs.core.get.call(null, m, k__85955), v__85956))
        }else {
          return cljs.core.assoc.call(null, m, k__85955, v__85956)
        }
      };
      var merge2__85959 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__85957, function() {
          var or__3548__auto____85958 = m1;
          if(cljs.core.truth_(or__3548__auto____85958)) {
            return or__3548__auto____85958
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__85959, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__85960) {
    var f = cljs.core.first(arglist__85960);
    var maps = cljs.core.rest(arglist__85960);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__85962 = cljs.core.ObjMap.fromObject([], {});
  var keys__85963 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__85963)) {
      var key__85964 = cljs.core.first.call(null, keys__85963);
      var entry__85965 = cljs.core.get.call(null, map, key__85964, "\ufdd0'user/not-found");
      var G__85966 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__85965, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__85962, key__85964, entry__85965) : ret__85962;
      var G__85967 = cljs.core.next.call(null, keys__85963);
      ret__85962 = G__85966;
      keys__85963 = G__85967;
      continue
    }else {
      return ret__85962
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__85968 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__85989 = null;
  var G__85989__85990 = function(coll, v) {
    var this__85969 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__85989__85991 = function(coll, v, not_found) {
    var this__85970 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__85970.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__85989 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85989__85990.call(this, coll, v);
      case 3:
        return G__85989__85991.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85989
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__85993 = null;
  var G__85993__85994 = function(tsym85971, k) {
    var this__85973 = this;
    var tsym85971__85974 = this;
    var coll__85975 = tsym85971__85974;
    return cljs.core._lookup.call(null, coll__85975, k)
  };
  var G__85993__85995 = function(tsym85972, k, not_found) {
    var this__85976 = this;
    var tsym85972__85977 = this;
    var coll__85978 = tsym85972__85977;
    return cljs.core._lookup.call(null, coll__85978, k, not_found)
  };
  G__85993 = function(tsym85972, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__85993__85994.call(this, tsym85972, k);
      case 3:
        return G__85993__85995.call(this, tsym85972, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__85993
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__85979 = this;
  return new cljs.core.Set(this__85979.meta, cljs.core.assoc.call(null, this__85979.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__85980 = this;
  return cljs.core.keys.call(null, this__85980.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__85981 = this;
  return new cljs.core.Set(this__85981.meta, cljs.core.dissoc.call(null, this__85981.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__85982 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__85983 = this;
  var and__3546__auto____85984 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____85984)) {
    var and__3546__auto____85985 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____85985)) {
      return cljs.core.every_QMARK_.call(null, function(p1__85961_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__85961_SHARP_)
      }, other)
    }else {
      return and__3546__auto____85985
    }
  }else {
    return and__3546__auto____85984
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__85986 = this;
  return new cljs.core.Set(meta, this__85986.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__85987 = this;
  return this__85987.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__85988 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__85988.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__85998 = cljs.core.seq.call(null, coll);
  var out__85999 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__85998)))) {
      var G__86000 = cljs.core.rest.call(null, in$__85998);
      var G__86001 = cljs.core.conj.call(null, out__85999, cljs.core.first.call(null, in$__85998));
      in$__85998 = G__86000;
      out__85999 = G__86001;
      continue
    }else {
      return out__85999
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__86002 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____86003 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____86003)) {
        var e__86004 = temp__3695__auto____86003;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__86004))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__86002, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__85997_SHARP_) {
      var temp__3695__auto____86005 = cljs.core.find.call(null, smap, p1__85997_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____86005)) {
        var e__86006 = temp__3695__auto____86005;
        return cljs.core.second.call(null, e__86006)
      }else {
        return p1__85997_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__86014 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__86007, seen) {
        while(true) {
          var vec__86008__86009 = p__86007;
          var f__86010 = cljs.core.nth.call(null, vec__86008__86009, 0, null);
          var xs__86011 = vec__86008__86009;
          var temp__3698__auto____86012 = cljs.core.seq.call(null, xs__86011);
          if(cljs.core.truth_(temp__3698__auto____86012)) {
            var s__86013 = temp__3698__auto____86012;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__86010))) {
              var G__86015 = cljs.core.rest.call(null, s__86013);
              var G__86016 = seen;
              p__86007 = G__86015;
              seen = G__86016;
              continue
            }else {
              return cljs.core.cons.call(null, f__86010, step.call(null, cljs.core.rest.call(null, s__86013), cljs.core.conj.call(null, seen, f__86010)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__86014.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__86017 = cljs.core.Vector.fromArray([]);
  var s__86018 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__86018))) {
      var G__86019 = cljs.core.conj.call(null, ret__86017, cljs.core.first.call(null, s__86018));
      var G__86020 = cljs.core.next.call(null, s__86018);
      ret__86017 = G__86019;
      s__86018 = G__86020;
      continue
    }else {
      return cljs.core.seq.call(null, ret__86017)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____86021 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____86021)) {
        return or__3548__auto____86021
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__86022 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__86022 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__86022 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____86023 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____86023)) {
      return or__3548__auto____86023
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__86024 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__86024 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__86024)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__86027 = cljs.core.ObjMap.fromObject([], {});
  var ks__86028 = cljs.core.seq.call(null, keys);
  var vs__86029 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____86030 = ks__86028;
      if(cljs.core.truth_(and__3546__auto____86030)) {
        return vs__86029
      }else {
        return and__3546__auto____86030
      }
    }())) {
      var G__86031 = cljs.core.assoc.call(null, map__86027, cljs.core.first.call(null, ks__86028), cljs.core.first.call(null, vs__86029));
      var G__86032 = cljs.core.next.call(null, ks__86028);
      var G__86033 = cljs.core.next.call(null, vs__86029);
      map__86027 = G__86031;
      ks__86028 = G__86032;
      vs__86029 = G__86033;
      continue
    }else {
      return map__86027
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__86036 = function(k, x) {
    return x
  };
  var max_key__86037 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__86038 = function() {
    var G__86040__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__86025_SHARP_, p2__86026_SHARP_) {
        return max_key.call(null, k, p1__86025_SHARP_, p2__86026_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__86040 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__86040__delegate.call(this, k, x, y, more)
    };
    G__86040.cljs$lang$maxFixedArity = 3;
    G__86040.cljs$lang$applyTo = function(arglist__86041) {
      var k = cljs.core.first(arglist__86041);
      var x = cljs.core.first(cljs.core.next(arglist__86041));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__86041)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__86041)));
      return G__86040__delegate.call(this, k, x, y, more)
    };
    return G__86040
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__86036.call(this, k, x);
      case 3:
        return max_key__86037.call(this, k, x, y);
      default:
        return max_key__86038.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__86038.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__86042 = function(k, x) {
    return x
  };
  var min_key__86043 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__86044 = function() {
    var G__86046__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__86034_SHARP_, p2__86035_SHARP_) {
        return min_key.call(null, k, p1__86034_SHARP_, p2__86035_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__86046 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__86046__delegate.call(this, k, x, y, more)
    };
    G__86046.cljs$lang$maxFixedArity = 3;
    G__86046.cljs$lang$applyTo = function(arglist__86047) {
      var k = cljs.core.first(arglist__86047);
      var x = cljs.core.first(cljs.core.next(arglist__86047));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__86047)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__86047)));
      return G__86046__delegate.call(this, k, x, y, more)
    };
    return G__86046
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__86042.call(this, k, x);
      case 3:
        return min_key__86043.call(this, k, x, y);
      default:
        return min_key__86044.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__86044.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__86050 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__86051 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____86048 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____86048)) {
        var s__86049 = temp__3698__auto____86048;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__86049), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__86049)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__86050.call(this, n, step);
      case 3:
        return partition_all__86051.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____86053 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____86053)) {
      var s__86054 = temp__3698__auto____86053;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__86054)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__86054), take_while.call(null, pred, cljs.core.rest.call(null, s__86054)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__86055 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__86056 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__86072 = null;
  var G__86072__86073 = function(rng, f) {
    var this__86057 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__86072__86074 = function(rng, f, s) {
    var this__86058 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__86072 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__86072__86073.call(this, rng, f);
      case 3:
        return G__86072__86074.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__86072
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__86059 = this;
  var comp__86060 = cljs.core.truth_(this__86059.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__86060.call(null, this__86059.start, this__86059.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__86061 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__86061.end - this__86061.start) / this__86061.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__86062 = this;
  return this__86062.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__86063 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__86063.meta, this__86063.start + this__86063.step, this__86063.end, this__86063.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__86064 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__86065 = this;
  return new cljs.core.Range(meta, this__86065.start, this__86065.end, this__86065.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__86066 = this;
  return this__86066.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__86076 = null;
  var G__86076__86077 = function(rng, n) {
    var this__86067 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__86067.start + n * this__86067.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____86068 = this__86067.start > this__86067.end;
        if(cljs.core.truth_(and__3546__auto____86068)) {
          return cljs.core._EQ_.call(null, this__86067.step, 0)
        }else {
          return and__3546__auto____86068
        }
      }())) {
        return this__86067.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__86076__86078 = function(rng, n, not_found) {
    var this__86069 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__86069.start + n * this__86069.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____86070 = this__86069.start > this__86069.end;
        if(cljs.core.truth_(and__3546__auto____86070)) {
          return cljs.core._EQ_.call(null, this__86069.step, 0)
        }else {
          return and__3546__auto____86070
        }
      }())) {
        return this__86069.start
      }else {
        return not_found
      }
    }
  };
  G__86076 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__86076__86077.call(this, rng, n);
      case 3:
        return G__86076__86078.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__86076
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__86071 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__86071.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__86080 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__86081 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__86082 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__86083 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__86080.call(this);
      case 1:
        return range__86081.call(this, start);
      case 2:
        return range__86082.call(this, start, end);
      case 3:
        return range__86083.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____86085 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____86085)) {
      var s__86086 = temp__3698__auto____86085;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__86086), take_nth.call(null, n, cljs.core.drop.call(null, n, s__86086)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____86088 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____86088)) {
      var s__86089 = temp__3698__auto____86088;
      var fst__86090 = cljs.core.first.call(null, s__86089);
      var fv__86091 = f.call(null, fst__86090);
      var run__86092 = cljs.core.cons.call(null, fst__86090, cljs.core.take_while.call(null, function(p1__86087_SHARP_) {
        return cljs.core._EQ_.call(null, fv__86091, f.call(null, p1__86087_SHARP_))
      }, cljs.core.next.call(null, s__86089)));
      return cljs.core.cons.call(null, run__86092, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__86092), s__86089))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__86107 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____86103 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____86103)) {
        var s__86104 = temp__3695__auto____86103;
        return reductions.call(null, f, cljs.core.first.call(null, s__86104), cljs.core.rest.call(null, s__86104))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__86108 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____86105 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____86105)) {
        var s__86106 = temp__3698__auto____86105;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__86106)), cljs.core.rest.call(null, s__86106))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__86107.call(this, f, init);
      case 3:
        return reductions__86108.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__86111 = function(f) {
    return function() {
      var G__86116 = null;
      var G__86116__86117 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__86116__86118 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__86116__86119 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__86116__86120 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__86116__86121 = function() {
        var G__86123__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__86123 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__86123__delegate.call(this, x, y, z, args)
        };
        G__86123.cljs$lang$maxFixedArity = 3;
        G__86123.cljs$lang$applyTo = function(arglist__86124) {
          var x = cljs.core.first(arglist__86124);
          var y = cljs.core.first(cljs.core.next(arglist__86124));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__86124)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__86124)));
          return G__86123__delegate.call(this, x, y, z, args)
        };
        return G__86123
      }();
      G__86116 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__86116__86117.call(this);
          case 1:
            return G__86116__86118.call(this, x);
          case 2:
            return G__86116__86119.call(this, x, y);
          case 3:
            return G__86116__86120.call(this, x, y, z);
          default:
            return G__86116__86121.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__86116.cljs$lang$maxFixedArity = 3;
      G__86116.cljs$lang$applyTo = G__86116__86121.cljs$lang$applyTo;
      return G__86116
    }()
  };
  var juxt__86112 = function(f, g) {
    return function() {
      var G__86125 = null;
      var G__86125__86126 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__86125__86127 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__86125__86128 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__86125__86129 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__86125__86130 = function() {
        var G__86132__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__86132 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__86132__delegate.call(this, x, y, z, args)
        };
        G__86132.cljs$lang$maxFixedArity = 3;
        G__86132.cljs$lang$applyTo = function(arglist__86133) {
          var x = cljs.core.first(arglist__86133);
          var y = cljs.core.first(cljs.core.next(arglist__86133));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__86133)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__86133)));
          return G__86132__delegate.call(this, x, y, z, args)
        };
        return G__86132
      }();
      G__86125 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__86125__86126.call(this);
          case 1:
            return G__86125__86127.call(this, x);
          case 2:
            return G__86125__86128.call(this, x, y);
          case 3:
            return G__86125__86129.call(this, x, y, z);
          default:
            return G__86125__86130.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__86125.cljs$lang$maxFixedArity = 3;
      G__86125.cljs$lang$applyTo = G__86125__86130.cljs$lang$applyTo;
      return G__86125
    }()
  };
  var juxt__86113 = function(f, g, h) {
    return function() {
      var G__86134 = null;
      var G__86134__86135 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__86134__86136 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__86134__86137 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__86134__86138 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__86134__86139 = function() {
        var G__86141__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__86141 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__86141__delegate.call(this, x, y, z, args)
        };
        G__86141.cljs$lang$maxFixedArity = 3;
        G__86141.cljs$lang$applyTo = function(arglist__86142) {
          var x = cljs.core.first(arglist__86142);
          var y = cljs.core.first(cljs.core.next(arglist__86142));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__86142)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__86142)));
          return G__86141__delegate.call(this, x, y, z, args)
        };
        return G__86141
      }();
      G__86134 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__86134__86135.call(this);
          case 1:
            return G__86134__86136.call(this, x);
          case 2:
            return G__86134__86137.call(this, x, y);
          case 3:
            return G__86134__86138.call(this, x, y, z);
          default:
            return G__86134__86139.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__86134.cljs$lang$maxFixedArity = 3;
      G__86134.cljs$lang$applyTo = G__86134__86139.cljs$lang$applyTo;
      return G__86134
    }()
  };
  var juxt__86114 = function() {
    var G__86143__delegate = function(f, g, h, fs) {
      var fs__86110 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__86144 = null;
        var G__86144__86145 = function() {
          return cljs.core.reduce.call(null, function(p1__86093_SHARP_, p2__86094_SHARP_) {
            return cljs.core.conj.call(null, p1__86093_SHARP_, p2__86094_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__86110)
        };
        var G__86144__86146 = function(x) {
          return cljs.core.reduce.call(null, function(p1__86095_SHARP_, p2__86096_SHARP_) {
            return cljs.core.conj.call(null, p1__86095_SHARP_, p2__86096_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__86110)
        };
        var G__86144__86147 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__86097_SHARP_, p2__86098_SHARP_) {
            return cljs.core.conj.call(null, p1__86097_SHARP_, p2__86098_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__86110)
        };
        var G__86144__86148 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__86099_SHARP_, p2__86100_SHARP_) {
            return cljs.core.conj.call(null, p1__86099_SHARP_, p2__86100_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__86110)
        };
        var G__86144__86149 = function() {
          var G__86151__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__86101_SHARP_, p2__86102_SHARP_) {
              return cljs.core.conj.call(null, p1__86101_SHARP_, cljs.core.apply.call(null, p2__86102_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__86110)
          };
          var G__86151 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__86151__delegate.call(this, x, y, z, args)
          };
          G__86151.cljs$lang$maxFixedArity = 3;
          G__86151.cljs$lang$applyTo = function(arglist__86152) {
            var x = cljs.core.first(arglist__86152);
            var y = cljs.core.first(cljs.core.next(arglist__86152));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__86152)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__86152)));
            return G__86151__delegate.call(this, x, y, z, args)
          };
          return G__86151
        }();
        G__86144 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__86144__86145.call(this);
            case 1:
              return G__86144__86146.call(this, x);
            case 2:
              return G__86144__86147.call(this, x, y);
            case 3:
              return G__86144__86148.call(this, x, y, z);
            default:
              return G__86144__86149.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__86144.cljs$lang$maxFixedArity = 3;
        G__86144.cljs$lang$applyTo = G__86144__86149.cljs$lang$applyTo;
        return G__86144
      }()
    };
    var G__86143 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__86143__delegate.call(this, f, g, h, fs)
    };
    G__86143.cljs$lang$maxFixedArity = 3;
    G__86143.cljs$lang$applyTo = function(arglist__86153) {
      var f = cljs.core.first(arglist__86153);
      var g = cljs.core.first(cljs.core.next(arglist__86153));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__86153)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__86153)));
      return G__86143__delegate.call(this, f, g, h, fs)
    };
    return G__86143
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__86111.call(this, f);
      case 2:
        return juxt__86112.call(this, f, g);
      case 3:
        return juxt__86113.call(this, f, g, h);
      default:
        return juxt__86114.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__86114.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__86155 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__86158 = cljs.core.next.call(null, coll);
        coll = G__86158;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__86156 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____86154 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____86154)) {
          return n > 0
        }else {
          return and__3546__auto____86154
        }
      }())) {
        var G__86159 = n - 1;
        var G__86160 = cljs.core.next.call(null, coll);
        n = G__86159;
        coll = G__86160;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__86155.call(this, n);
      case 2:
        return dorun__86156.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__86161 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__86162 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__86161.call(this, n);
      case 2:
        return doall__86162.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__86164 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__86164), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__86164), 1))) {
      return cljs.core.first.call(null, matches__86164)
    }else {
      return cljs.core.vec.call(null, matches__86164)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__86165 = re.exec(s);
  if(cljs.core.truth_(matches__86165 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__86165), 1))) {
      return cljs.core.first.call(null, matches__86165)
    }else {
      return cljs.core.vec.call(null, matches__86165)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__86166 = cljs.core.re_find.call(null, re, s);
  var match_idx__86167 = s.search(re);
  var match_str__86168 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__86166)) ? cljs.core.first.call(null, match_data__86166) : match_data__86166;
  var post_match__86169 = cljs.core.subs.call(null, s, match_idx__86167 + cljs.core.count.call(null, match_str__86168));
  if(cljs.core.truth_(match_data__86166)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__86166, re_seq.call(null, re, post_match__86169))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__86171__86172 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___86173 = cljs.core.nth.call(null, vec__86171__86172, 0, null);
  var flags__86174 = cljs.core.nth.call(null, vec__86171__86172, 1, null);
  var pattern__86175 = cljs.core.nth.call(null, vec__86171__86172, 2, null);
  return new RegExp(pattern__86175, flags__86174)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__86170_SHARP_) {
    return print_one.call(null, p1__86170_SHARP_, opts)
  }, coll))), cljs.core.Vector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____86176 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____86176)) {
            var and__3546__auto____86180 = function() {
              var x__450__auto____86177 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____86178 = x__450__auto____86177;
                if(cljs.core.truth_(and__3546__auto____86178)) {
                  var and__3546__auto____86179 = x__450__auto____86177.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____86179)) {
                    return cljs.core.not.call(null, x__450__auto____86177.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____86179
                  }
                }else {
                  return and__3546__auto____86178
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____86177)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____86180)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____86180
            }
          }else {
            return and__3546__auto____86176
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__450__auto____86181 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____86182 = x__450__auto____86181;
            if(cljs.core.truth_(and__3546__auto____86182)) {
              var and__3546__auto____86183 = x__450__auto____86181.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____86183)) {
                return cljs.core.not.call(null, x__450__auto____86181.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____86183
              }
            }else {
              return and__3546__auto____86182
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__450__auto____86181)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__86184 = cljs.core.first.call(null, objs);
  var sb__86185 = new goog.string.StringBuffer;
  var G__86186__86187 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__86186__86187)) {
    var obj__86188 = cljs.core.first.call(null, G__86186__86187);
    var G__86186__86189 = G__86186__86187;
    while(true) {
      if(cljs.core.truth_(obj__86188 === first_obj__86184)) {
      }else {
        sb__86185.append(" ")
      }
      var G__86190__86191 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__86188, opts));
      if(cljs.core.truth_(G__86190__86191)) {
        var string__86192 = cljs.core.first.call(null, G__86190__86191);
        var G__86190__86193 = G__86190__86191;
        while(true) {
          sb__86185.append(string__86192);
          var temp__3698__auto____86194 = cljs.core.next.call(null, G__86190__86193);
          if(cljs.core.truth_(temp__3698__auto____86194)) {
            var G__86190__86195 = temp__3698__auto____86194;
            var G__86198 = cljs.core.first.call(null, G__86190__86195);
            var G__86199 = G__86190__86195;
            string__86192 = G__86198;
            G__86190__86193 = G__86199;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____86196 = cljs.core.next.call(null, G__86186__86189);
      if(cljs.core.truth_(temp__3698__auto____86196)) {
        var G__86186__86197 = temp__3698__auto____86196;
        var G__86200 = cljs.core.first.call(null, G__86186__86197);
        var G__86201 = G__86186__86197;
        obj__86188 = G__86200;
        G__86186__86189 = G__86201;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__86185)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__86202 = cljs.core.first.call(null, objs);
  var G__86203__86204 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__86203__86204)) {
    var obj__86205 = cljs.core.first.call(null, G__86203__86204);
    var G__86203__86206 = G__86203__86204;
    while(true) {
      if(cljs.core.truth_(obj__86205 === first_obj__86202)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__86207__86208 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__86205, opts));
      if(cljs.core.truth_(G__86207__86208)) {
        var string__86209 = cljs.core.first.call(null, G__86207__86208);
        var G__86207__86210 = G__86207__86208;
        while(true) {
          cljs.core.string_print.call(null, string__86209);
          var temp__3698__auto____86211 = cljs.core.next.call(null, G__86207__86210);
          if(cljs.core.truth_(temp__3698__auto____86211)) {
            var G__86207__86212 = temp__3698__auto____86211;
            var G__86215 = cljs.core.first.call(null, G__86207__86212);
            var G__86216 = G__86207__86212;
            string__86209 = G__86215;
            G__86207__86210 = G__86216;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____86213 = cljs.core.next.call(null, G__86203__86206);
      if(cljs.core.truth_(temp__3698__auto____86213)) {
        var G__86203__86214 = temp__3698__auto____86213;
        var G__86217 = cljs.core.first.call(null, G__86203__86214);
        var G__86218 = G__86203__86214;
        obj__86205 = G__86217;
        G__86203__86206 = G__86218;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__86219) {
    var objs = cljs.core.seq(arglist__86219);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__86220) {
    var objs = cljs.core.seq(arglist__86220);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__86221) {
    var objs = cljs.core.seq(arglist__86221);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__86222) {
    var objs = cljs.core.seq(arglist__86222);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__86223) {
    var objs = cljs.core.seq(arglist__86223);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__86224 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__86224, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____86225 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____86225)) {
        var nspc__86226 = temp__3698__auto____86225;
        return cljs.core.str.call(null, nspc__86226, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____86227 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____86227)) {
          var nspc__86228 = temp__3698__auto____86227;
          return cljs.core.str.call(null, nspc__86228, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__86229 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__86229, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__86230 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__86231 = this;
  var G__86232__86233 = cljs.core.seq.call(null, this__86231.watches);
  if(cljs.core.truth_(G__86232__86233)) {
    var G__86235__86237 = cljs.core.first.call(null, G__86232__86233);
    var vec__86236__86238 = G__86235__86237;
    var key__86239 = cljs.core.nth.call(null, vec__86236__86238, 0, null);
    var f__86240 = cljs.core.nth.call(null, vec__86236__86238, 1, null);
    var G__86232__86241 = G__86232__86233;
    var G__86235__86242 = G__86235__86237;
    var G__86232__86243 = G__86232__86241;
    while(true) {
      var vec__86244__86245 = G__86235__86242;
      var key__86246 = cljs.core.nth.call(null, vec__86244__86245, 0, null);
      var f__86247 = cljs.core.nth.call(null, vec__86244__86245, 1, null);
      var G__86232__86248 = G__86232__86243;
      f__86247.call(null, key__86246, this$, oldval, newval);
      var temp__3698__auto____86249 = cljs.core.next.call(null, G__86232__86248);
      if(cljs.core.truth_(temp__3698__auto____86249)) {
        var G__86232__86250 = temp__3698__auto____86249;
        var G__86257 = cljs.core.first.call(null, G__86232__86250);
        var G__86258 = G__86232__86250;
        G__86235__86242 = G__86257;
        G__86232__86243 = G__86258;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__86251 = this;
  return this$.watches = cljs.core.assoc.call(null, this__86251.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__86252 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__86252.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__86253 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__86253.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__86254 = this;
  return this__86254.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__86255 = this;
  return this__86255.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__86256 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__86265 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__86266 = function() {
    var G__86268__delegate = function(x, p__86259) {
      var map__86260__86261 = p__86259;
      var map__86260__86262 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__86260__86261)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__86260__86261) : map__86260__86261;
      var validator__86263 = cljs.core.get.call(null, map__86260__86262, "\ufdd0'validator");
      var meta__86264 = cljs.core.get.call(null, map__86260__86262, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__86264, validator__86263, null)
    };
    var G__86268 = function(x, var_args) {
      var p__86259 = null;
      if(goog.isDef(var_args)) {
        p__86259 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__86268__delegate.call(this, x, p__86259)
    };
    G__86268.cljs$lang$maxFixedArity = 1;
    G__86268.cljs$lang$applyTo = function(arglist__86269) {
      var x = cljs.core.first(arglist__86269);
      var p__86259 = cljs.core.rest(arglist__86269);
      return G__86268__delegate.call(this, x, p__86259)
    };
    return G__86268
  }();
  atom = function(x, var_args) {
    var p__86259 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__86265.call(this, x);
      default:
        return atom__86266.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__86266.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____86270 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____86270)) {
    var validate__86271 = temp__3698__auto____86270;
    if(cljs.core.truth_(validate__86271.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3073)))));
    }
  }else {
  }
  var old_value__86272 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__86272, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___86273 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___86274 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___86275 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___86276 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___86277 = function() {
    var G__86279__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__86279 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__86279__delegate.call(this, a, f, x, y, z, more)
    };
    G__86279.cljs$lang$maxFixedArity = 5;
    G__86279.cljs$lang$applyTo = function(arglist__86280) {
      var a = cljs.core.first(arglist__86280);
      var f = cljs.core.first(cljs.core.next(arglist__86280));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__86280)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__86280))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__86280)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__86280)))));
      return G__86279__delegate.call(this, a, f, x, y, z, more)
    };
    return G__86279
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___86273.call(this, a, f);
      case 3:
        return swap_BANG___86274.call(this, a, f, x);
      case 4:
        return swap_BANG___86275.call(this, a, f, x, y);
      case 5:
        return swap_BANG___86276.call(this, a, f, x, y, z);
      default:
        return swap_BANG___86277.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___86277.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__86281) {
    var iref = cljs.core.first(arglist__86281);
    var f = cljs.core.first(cljs.core.next(arglist__86281));
    var args = cljs.core.rest(cljs.core.next(arglist__86281));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__86282 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__86283 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__86282.call(this);
      case 1:
        return gensym__86283.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(f, state) {
  this.f = f;
  this.state = state
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__86285 = this;
  return cljs.core.not.call(null, cljs.core.deref.call(null, this__86285.state) === null)
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__86286 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__86286.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__86286.state, this__86286.f)
  }
  return cljs.core.deref.call(null, this__86286.state)
};
cljs.core.Delay;
cljs.core.delay = function() {
  var delay__delegate = function(body) {
    return new cljs.core.Delay(function() {
      return cljs.core.apply.call(null, cljs.core.identity, body)
    }, cljs.core.atom.call(null, null))
  };
  var delay = function(var_args) {
    var body = null;
    if(goog.isDef(var_args)) {
      body = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return delay__delegate.call(this, body)
  };
  delay.cljs$lang$maxFixedArity = 0;
  delay.cljs$lang$applyTo = function(arglist__86287) {
    var body = cljs.core.seq(arglist__86287);
    return delay__delegate.call(this, body)
  };
  return delay
}();
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__86288__86289 = options;
    var map__86288__86290 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__86288__86289)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__86288__86289) : map__86288__86289;
    var keywordize_keys__86291 = cljs.core.get.call(null, map__86288__86290, "\ufdd0'keywordize-keys");
    var keyfn__86292 = cljs.core.truth_(keywordize_keys__86291) ? cljs.core.keyword : cljs.core.str;
    var f__86298 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__514__auto____86297 = function iter__86293(s__86294) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__86294__86295 = s__86294;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__86294__86295))) {
                        var k__86296 = cljs.core.first.call(null, s__86294__86295);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__86292.call(null, k__86296), thisfn.call(null, x[k__86296])]), iter__86293.call(null, cljs.core.rest.call(null, s__86294__86295)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__514__auto____86297.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__86298.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__86299) {
    var x = cljs.core.first(arglist__86299);
    var options = cljs.core.rest(arglist__86299);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__86300 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__86304__delegate = function(args) {
      var temp__3695__auto____86301 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__86300), args);
      if(cljs.core.truth_(temp__3695__auto____86301)) {
        var v__86302 = temp__3695__auto____86301;
        return v__86302
      }else {
        var ret__86303 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__86300, cljs.core.assoc, args, ret__86303);
        return ret__86303
      }
    };
    var G__86304 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__86304__delegate.call(this, args)
    };
    G__86304.cljs$lang$maxFixedArity = 0;
    G__86304.cljs$lang$applyTo = function(arglist__86305) {
      var args = cljs.core.seq(arglist__86305);
      return G__86304__delegate.call(this, args)
    };
    return G__86304
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__86307 = function(f) {
    while(true) {
      var ret__86306 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__86306))) {
        var G__86310 = ret__86306;
        f = G__86310;
        continue
      }else {
        return ret__86306
      }
      break
    }
  };
  var trampoline__86308 = function() {
    var G__86311__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__86311 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__86311__delegate.call(this, f, args)
    };
    G__86311.cljs$lang$maxFixedArity = 1;
    G__86311.cljs$lang$applyTo = function(arglist__86312) {
      var f = cljs.core.first(arglist__86312);
      var args = cljs.core.rest(arglist__86312);
      return G__86311__delegate.call(this, f, args)
    };
    return G__86311
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__86307.call(this, f);
      default:
        return trampoline__86308.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__86308.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__86313 = function() {
    return rand.call(null, 1)
  };
  var rand__86314 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__86313.call(this);
      case 1:
        return rand__86314.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__86316 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__86316, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__86316, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___86325 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___86326 = function(h, child, parent) {
    var or__3548__auto____86317 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____86317)) {
      return or__3548__auto____86317
    }else {
      var or__3548__auto____86318 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____86318)) {
        return or__3548__auto____86318
      }else {
        var and__3546__auto____86319 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____86319)) {
          var and__3546__auto____86320 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____86320)) {
            var and__3546__auto____86321 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____86321)) {
              var ret__86322 = true;
              var i__86323 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____86324 = cljs.core.not.call(null, ret__86322);
                  if(cljs.core.truth_(or__3548__auto____86324)) {
                    return or__3548__auto____86324
                  }else {
                    return cljs.core._EQ_.call(null, i__86323, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__86322
                }else {
                  var G__86328 = isa_QMARK_.call(null, h, child.call(null, i__86323), parent.call(null, i__86323));
                  var G__86329 = i__86323 + 1;
                  ret__86322 = G__86328;
                  i__86323 = G__86329;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____86321
            }
          }else {
            return and__3546__auto____86320
          }
        }else {
          return and__3546__auto____86319
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___86325.call(this, h, child);
      case 3:
        return isa_QMARK___86326.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__86330 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__86331 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__86330.call(this, h);
      case 2:
        return parents__86331.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__86333 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__86334 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__86333.call(this, h);
      case 2:
        return ancestors__86334.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__86336 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__86337 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__86336.call(this, h);
      case 2:
        return descendants__86337.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__86347 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3365)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__86348 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3369)))));
    }
    var tp__86342 = "\ufdd0'parents".call(null, h);
    var td__86343 = "\ufdd0'descendants".call(null, h);
    var ta__86344 = "\ufdd0'ancestors".call(null, h);
    var tf__86345 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____86346 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__86342.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__86344.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__86344.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__86342, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__86345.call(null, "\ufdd0'ancestors".call(null, h), tag, td__86343, parent, ta__86344), "\ufdd0'descendants":tf__86345.call(null, "\ufdd0'descendants".call(null, h), parent, ta__86344, tag, td__86343)})
    }();
    if(cljs.core.truth_(or__3548__auto____86346)) {
      return or__3548__auto____86346
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__86347.call(this, h, tag);
      case 3:
        return derive__86348.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__86354 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__86355 = function(h, tag, parent) {
    var parentMap__86350 = "\ufdd0'parents".call(null, h);
    var childsParents__86351 = cljs.core.truth_(parentMap__86350.call(null, tag)) ? cljs.core.disj.call(null, parentMap__86350.call(null, tag), parent) : cljs.core.set([]);
    var newParents__86352 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__86351)) ? cljs.core.assoc.call(null, parentMap__86350, tag, childsParents__86351) : cljs.core.dissoc.call(null, parentMap__86350, tag);
    var deriv_seq__86353 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__86339_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__86339_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__86339_SHARP_), cljs.core.second.call(null, p1__86339_SHARP_)))
    }, cljs.core.seq.call(null, newParents__86352)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__86350.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__86340_SHARP_, p2__86341_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__86340_SHARP_, p2__86341_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__86353))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__86354.call(this, h, tag);
      case 3:
        return underive__86355.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__86357 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____86359 = cljs.core.truth_(function() {
    var and__3546__auto____86358 = xprefs__86357;
    if(cljs.core.truth_(and__3546__auto____86358)) {
      return xprefs__86357.call(null, y)
    }else {
      return and__3546__auto____86358
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____86359)) {
    return or__3548__auto____86359
  }else {
    var or__3548__auto____86361 = function() {
      var ps__86360 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__86360) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__86360), prefer_table))) {
          }else {
          }
          var G__86364 = cljs.core.rest.call(null, ps__86360);
          ps__86360 = G__86364;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____86361)) {
      return or__3548__auto____86361
    }else {
      var or__3548__auto____86363 = function() {
        var ps__86362 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__86362) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__86362), y, prefer_table))) {
            }else {
            }
            var G__86365 = cljs.core.rest.call(null, ps__86362);
            ps__86362 = G__86365;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____86363)) {
        return or__3548__auto____86363
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____86366 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____86366)) {
    return or__3548__auto____86366
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__86375 = cljs.core.reduce.call(null, function(be, p__86367) {
    var vec__86368__86369 = p__86367;
    var k__86370 = cljs.core.nth.call(null, vec__86368__86369, 0, null);
    var ___86371 = cljs.core.nth.call(null, vec__86368__86369, 1, null);
    var e__86372 = vec__86368__86369;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__86370))) {
      var be2__86374 = cljs.core.truth_(function() {
        var or__3548__auto____86373 = be === null;
        if(cljs.core.truth_(or__3548__auto____86373)) {
          return or__3548__auto____86373
        }else {
          return cljs.core.dominates.call(null, k__86370, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__86372 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__86374), k__86370, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__86370, " and ", cljs.core.first.call(null, be2__86374), ", and neither is preferred"));
      }
      return be2__86374
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__86375)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__86375));
      return cljs.core.second.call(null, best_entry__86375)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____86376 = mf;
    if(cljs.core.truth_(and__3546__auto____86376)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____86376
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____86377 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____86377)) {
        return or__3548__auto____86377
      }else {
        var or__3548__auto____86378 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____86378)) {
          return or__3548__auto____86378
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____86379 = mf;
    if(cljs.core.truth_(and__3546__auto____86379)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____86379
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____86380 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____86380)) {
        return or__3548__auto____86380
      }else {
        var or__3548__auto____86381 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____86381)) {
          return or__3548__auto____86381
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____86382 = mf;
    if(cljs.core.truth_(and__3546__auto____86382)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____86382
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____86383 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____86383)) {
        return or__3548__auto____86383
      }else {
        var or__3548__auto____86384 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____86384)) {
          return or__3548__auto____86384
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____86385 = mf;
    if(cljs.core.truth_(and__3546__auto____86385)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____86385
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____86386 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____86386)) {
        return or__3548__auto____86386
      }else {
        var or__3548__auto____86387 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____86387)) {
          return or__3548__auto____86387
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____86388 = mf;
    if(cljs.core.truth_(and__3546__auto____86388)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____86388
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____86389 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____86389)) {
        return or__3548__auto____86389
      }else {
        var or__3548__auto____86390 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____86390)) {
          return or__3548__auto____86390
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____86391 = mf;
    if(cljs.core.truth_(and__3546__auto____86391)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____86391
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____86392 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____86392)) {
        return or__3548__auto____86392
      }else {
        var or__3548__auto____86393 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____86393)) {
          return or__3548__auto____86393
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____86394 = mf;
    if(cljs.core.truth_(and__3546__auto____86394)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____86394
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____86395 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____86395)) {
        return or__3548__auto____86395
      }else {
        var or__3548__auto____86396 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____86396)) {
          return or__3548__auto____86396
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____86397 = mf;
    if(cljs.core.truth_(and__3546__auto____86397)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____86397
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____86398 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____86398)) {
        return or__3548__auto____86398
      }else {
        var or__3548__auto____86399 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____86399)) {
          return or__3548__auto____86399
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__86400 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__86401 = cljs.core._get_method.call(null, mf, dispatch_val__86400);
  if(cljs.core.truth_(target_fn__86401)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__86400));
  }
  return cljs.core.apply.call(null, target_fn__86401, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__86402 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__86403 = this;
  cljs.core.swap_BANG_.call(null, this__86403.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__86403.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__86403.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__86403.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__86404 = this;
  cljs.core.swap_BANG_.call(null, this__86404.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__86404.method_cache, this__86404.method_table, this__86404.cached_hierarchy, this__86404.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__86405 = this;
  cljs.core.swap_BANG_.call(null, this__86405.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__86405.method_cache, this__86405.method_table, this__86405.cached_hierarchy, this__86405.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__86406 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__86406.cached_hierarchy), cljs.core.deref.call(null, this__86406.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__86406.method_cache, this__86406.method_table, this__86406.cached_hierarchy, this__86406.hierarchy)
  }
  var temp__3695__auto____86407 = cljs.core.deref.call(null, this__86406.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____86407)) {
    var target_fn__86408 = temp__3695__auto____86407;
    return target_fn__86408
  }else {
    var temp__3695__auto____86409 = cljs.core.find_and_cache_best_method.call(null, this__86406.name, dispatch_val, this__86406.hierarchy, this__86406.method_table, this__86406.prefer_table, this__86406.method_cache, this__86406.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____86409)) {
      var target_fn__86410 = temp__3695__auto____86409;
      return target_fn__86410
    }else {
      return cljs.core.deref.call(null, this__86406.method_table).call(null, this__86406.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__86411 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__86411.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__86411.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__86411.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__86411.method_cache, this__86411.method_table, this__86411.cached_hierarchy, this__86411.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__86412 = this;
  return cljs.core.deref.call(null, this__86412.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__86413 = this;
  return cljs.core.deref.call(null, this__86413.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__86414 = this;
  return cljs.core.do_dispatch.call(null, mf, this__86414.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__86415__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__86415 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__86415__delegate.call(this, _, args)
  };
  G__86415.cljs$lang$maxFixedArity = 1;
  G__86415.cljs$lang$applyTo = function(arglist__86416) {
    var _ = cljs.core.first(arglist__86416);
    var args = cljs.core.rest(arglist__86416);
    return G__86415__delegate.call(this, _, args)
  };
  return G__86415
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("example.log");
goog.require("cljs.core");
example.log.debug = function() {
  var debug__delegate = function(s) {
    return console.log(cljs.core.apply.call(null, cljs.core.str, cljs.core.cons.call(null, "[DEBUG] ", s)))
  };
  var debug = function(var_args) {
    var s = null;
    if(goog.isDef(var_args)) {
      s = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return debug__delegate.call(this, s)
  };
  debug.cljs$lang$maxFixedArity = 0;
  debug.cljs$lang$applyTo = function(arglist__84696) {
    var s = cljs.core.seq(arglist__84696);
    return debug__delegate.call(this, s)
  };
  return debug
}();
goog.provide("example.model");
goog.require("cljs.core");
goog.require("goog.Timer");
goog.require("goog.events");
goog.require("example.log");
example.model.WIDTH = 100;
example.model.HEIGHT = 50;
example.model.init_random = function init_random() {
  return cljs.core.map.call(null, function() {
    if(cljs.core.truth_(0.2 < cljs.core.rand.call(null, 1))) {
      return"\ufdd0'live"
    }else {
      return"\ufdd0'dead"
    }
  }, cljs.core.range.call(null, example.model.WIDTH * example.model.HEIGHT))
};
example.model.grid = cljs.core.atom.call(null, example.model.init_random.call(null));
example.model.timer = new goog.Timer(1E3 / 60);
example.model.living_QMARK_ = function living_QMARK_(x) {
  return cljs.core._EQ_.call(null, x, "\ufdd0'live")
};
example.model.alive_this_time_QMARK_ = function alive_this_time_QMARK_(x) {
  return example.model.living_QMARK_.call(null, example.model.grid.call(null, x))
};
example.model.alive_next_time_QMARK_ = function alive_next_time_QMARK_(offset) {
  var indexes__84706 = cljs.core.juxt.call(null, function(p1__84697_SHARP_) {
    return p1__84697_SHARP_ - 1
  }, function(p1__84698_SHARP_) {
    return p1__84698_SHARP_ + 1
  }, function(p1__84699_SHARP_) {
    return p1__84699_SHARP_ - example.model.WIDTH
  }, function(p1__84700_SHARP_) {
    return p1__84700_SHARP_ + example.model.WIDTH
  }, function(p1__84701_SHARP_) {
    return p1__84701_SHARP_ - (example.model.WIDTH + 1)
  }, function(p1__84702_SHARP_) {
    return p1__84702_SHARP_ + (example.model.WIDTH + 1)
  }, function(p1__84703_SHARP_) {
    return p1__84703_SHARP_ - (example.model.WIDTH - 1)
  }, function(p1__84704_SHARP_) {
    return p1__84704_SHARP_ + (example.model.WIDTH - 1)
  }).call(null, offset);
  var vals__84707 = cljs.core.map.call(null, example.model.grid, indexes__84706);
  var num__84708 = cljs.core.count.call(null, cljs.core.filter.call(null, example.model.living_QMARK_, vals__84707));
  if(cljs.core.truth_(function() {
    var or__3548__auto____84709 = num__84708 > 3;
    if(cljs.core.truth_(or__3548__auto____84709)) {
      return or__3548__auto____84709
    }else {
      return num__84708 < 2
    }
  }())) {
    return"\ufdd0'dead"
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, num__84708, 3))) {
      return"\ufdd0'live"
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____84710 = cljs.core._EQ_.call(null, num__84708, 2);
        if(cljs.core.truth_(and__3546__auto____84710)) {
          return example.model.alive_this_time_QMARK_.call(null, example.model.x)
        }else {
          return and__3546__auto____84710
        }
      }())) {
        return"\ufdd0'live"
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return"\ufdd0'dead"
        }else {
          return null
        }
      }
    }
  }
};
example.model.update_model = function update_model() {
  example.log.debug.call(null, "update-model");
  return cljs.core.swap_BANG_.call(null, example.model.grid, function(p1__84705_SHARP_) {
    return cljs.core.map_indexed.call(null, example.model.alive_next_time_QMARK_, p1__84705_SHARP_)
  })
};
example.model.poll = function poll() {
  var timer__84711 = new goog.Timer(1E3);
  example.model.update_model.call(null);
  timer__84711.start();
  return goog.events.listen.call(null, timer__84711, goog.Timer.TICK, example.model.update_model)
};
example.model.add_listener = function add_listener(f) {
  return cljs.core.add_watch.call(null, example.model.grid, null, function(k, r, o, n) {
    return f.call(null, n)
  })
};
goog.provide("example.view");
goog.require("cljs.core");
goog.require("example.model");
goog.require("goog.dom");
goog.require("example.log");
example.view.by_id = function by_id(id) {
  return example.view.dom.getElement(id)
};
example.view.set_cell_state = function set_cell_state(x, y, state) {
  var temp__3695__auto____84714 = example.view.by_id.call(null, cljs.core.str.call(null, x, "-", y));
  if(cljs.core.truth_(temp__3695__auto____84714)) {
    var e__84715 = temp__3695__auto____84714;
    if(cljs.core.truth_(cljs.core._EQ_.call(null, state, "\ufdd0'live"))) {
      return e__84715.removeAttribute("class")
    }else {
      return e__84715.setAttribute("class", cljs.core.name.call(null, state))
    }
  }else {
    return null
  }
};
example.view.grid_updated = function grid_updated(grid) {
  example.log.debug.call(null, "grid-updated", grid);
  return cljs.core.doall.call(null, cljs.core.map_indexed.call(null, function(p1__84712_SHARP_, p2__84713_SHARP_) {
    var x__84716 = p1__84712_SHARP_ % example.view.WIDTH;
    var y__84717 = Math.floor.call(null, p1__84712_SHARP_ / example.view.HEIGHT);
    return example.view.set_cell_state.call(null, x__84716, y__84717, p2__84713_SHARP_)
  }, grid))
};
example.model.add_listener.call(null, example.view.grid_updated);
window.onload = example.model.poll;
goog.provide("example.repl");
goog.require("cljs.core");
