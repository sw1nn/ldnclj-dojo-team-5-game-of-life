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
  var or__3548__auto____33740 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____33740)) {
    return or__3548__auto____33740
  }else {
    var or__3548__auto____33741 = p["_"];
    if(cljs.core.truth_(or__3548__auto____33741)) {
      return or__3548__auto____33741
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
  var _invoke__33805 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33742 = this$;
      if(cljs.core.truth_(and__3546__auto____33742)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33742
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____33743 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33743)) {
          return or__3548__auto____33743
        }else {
          var or__3548__auto____33744 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33744)) {
            return or__3548__auto____33744
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__33806 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33745 = this$;
      if(cljs.core.truth_(and__3546__auto____33745)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33745
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____33746 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33746)) {
          return or__3548__auto____33746
        }else {
          var or__3548__auto____33747 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33747)) {
            return or__3548__auto____33747
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__33807 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33748 = this$;
      if(cljs.core.truth_(and__3546__auto____33748)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33748
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____33749 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33749)) {
          return or__3548__auto____33749
        }else {
          var or__3548__auto____33750 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33750)) {
            return or__3548__auto____33750
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__33808 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33751 = this$;
      if(cljs.core.truth_(and__3546__auto____33751)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33751
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____33752 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33752)) {
          return or__3548__auto____33752
        }else {
          var or__3548__auto____33753 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33753)) {
            return or__3548__auto____33753
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__33809 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33754 = this$;
      if(cljs.core.truth_(and__3546__auto____33754)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33754
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____33755 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33755)) {
          return or__3548__auto____33755
        }else {
          var or__3548__auto____33756 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33756)) {
            return or__3548__auto____33756
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__33810 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33757 = this$;
      if(cljs.core.truth_(and__3546__auto____33757)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33757
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____33758 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33758)) {
          return or__3548__auto____33758
        }else {
          var or__3548__auto____33759 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33759)) {
            return or__3548__auto____33759
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__33811 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33760 = this$;
      if(cljs.core.truth_(and__3546__auto____33760)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33760
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____33761 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33761)) {
          return or__3548__auto____33761
        }else {
          var or__3548__auto____33762 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33762)) {
            return or__3548__auto____33762
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__33812 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33763 = this$;
      if(cljs.core.truth_(and__3546__auto____33763)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33763
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____33764 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33764)) {
          return or__3548__auto____33764
        }else {
          var or__3548__auto____33765 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33765)) {
            return or__3548__auto____33765
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__33813 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33766 = this$;
      if(cljs.core.truth_(and__3546__auto____33766)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33766
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____33767 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33767)) {
          return or__3548__auto____33767
        }else {
          var or__3548__auto____33768 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33768)) {
            return or__3548__auto____33768
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__33814 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33769 = this$;
      if(cljs.core.truth_(and__3546__auto____33769)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33769
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____33770 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33770)) {
          return or__3548__auto____33770
        }else {
          var or__3548__auto____33771 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33771)) {
            return or__3548__auto____33771
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__33815 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33772 = this$;
      if(cljs.core.truth_(and__3546__auto____33772)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33772
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____33773 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33773)) {
          return or__3548__auto____33773
        }else {
          var or__3548__auto____33774 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33774)) {
            return or__3548__auto____33774
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__33816 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33775 = this$;
      if(cljs.core.truth_(and__3546__auto____33775)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33775
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____33776 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33776)) {
          return or__3548__auto____33776
        }else {
          var or__3548__auto____33777 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33777)) {
            return or__3548__auto____33777
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__33817 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33778 = this$;
      if(cljs.core.truth_(and__3546__auto____33778)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33778
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____33779 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33779)) {
          return or__3548__auto____33779
        }else {
          var or__3548__auto____33780 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33780)) {
            return or__3548__auto____33780
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__33818 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33781 = this$;
      if(cljs.core.truth_(and__3546__auto____33781)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33781
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____33782 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33782)) {
          return or__3548__auto____33782
        }else {
          var or__3548__auto____33783 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33783)) {
            return or__3548__auto____33783
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__33819 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33784 = this$;
      if(cljs.core.truth_(and__3546__auto____33784)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33784
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____33785 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33785)) {
          return or__3548__auto____33785
        }else {
          var or__3548__auto____33786 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33786)) {
            return or__3548__auto____33786
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__33820 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33787 = this$;
      if(cljs.core.truth_(and__3546__auto____33787)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33787
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____33788 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33788)) {
          return or__3548__auto____33788
        }else {
          var or__3548__auto____33789 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33789)) {
            return or__3548__auto____33789
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__33821 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33790 = this$;
      if(cljs.core.truth_(and__3546__auto____33790)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33790
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____33791 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33791)) {
          return or__3548__auto____33791
        }else {
          var or__3548__auto____33792 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33792)) {
            return or__3548__auto____33792
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__33822 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33793 = this$;
      if(cljs.core.truth_(and__3546__auto____33793)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33793
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____33794 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33794)) {
          return or__3548__auto____33794
        }else {
          var or__3548__auto____33795 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33795)) {
            return or__3548__auto____33795
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__33823 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33796 = this$;
      if(cljs.core.truth_(and__3546__auto____33796)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33796
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____33797 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33797)) {
          return or__3548__auto____33797
        }else {
          var or__3548__auto____33798 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33798)) {
            return or__3548__auto____33798
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__33824 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33799 = this$;
      if(cljs.core.truth_(and__3546__auto____33799)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33799
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____33800 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33800)) {
          return or__3548__auto____33800
        }else {
          var or__3548__auto____33801 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33801)) {
            return or__3548__auto____33801
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__33825 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33802 = this$;
      if(cljs.core.truth_(and__3546__auto____33802)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____33802
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____33803 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____33803)) {
          return or__3548__auto____33803
        }else {
          var or__3548__auto____33804 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____33804)) {
            return or__3548__auto____33804
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
        return _invoke__33805.call(this, this$);
      case 2:
        return _invoke__33806.call(this, this$, a);
      case 3:
        return _invoke__33807.call(this, this$, a, b);
      case 4:
        return _invoke__33808.call(this, this$, a, b, c);
      case 5:
        return _invoke__33809.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__33810.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__33811.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__33812.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__33813.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__33814.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__33815.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__33816.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__33817.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__33818.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__33819.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__33820.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__33821.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__33822.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__33823.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__33824.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__33825.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33827 = coll;
    if(cljs.core.truth_(and__3546__auto____33827)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____33827
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____33828 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33828)) {
        return or__3548__auto____33828
      }else {
        var or__3548__auto____33829 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____33829)) {
          return or__3548__auto____33829
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
    var and__3546__auto____33830 = coll;
    if(cljs.core.truth_(and__3546__auto____33830)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____33830
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____33831 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33831)) {
        return or__3548__auto____33831
      }else {
        var or__3548__auto____33832 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____33832)) {
          return or__3548__auto____33832
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
    var and__3546__auto____33833 = coll;
    if(cljs.core.truth_(and__3546__auto____33833)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____33833
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____33834 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33834)) {
        return or__3548__auto____33834
      }else {
        var or__3548__auto____33835 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____33835)) {
          return or__3548__auto____33835
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
  var _nth__33842 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33836 = coll;
      if(cljs.core.truth_(and__3546__auto____33836)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____33836
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____33837 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____33837)) {
          return or__3548__auto____33837
        }else {
          var or__3548__auto____33838 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____33838)) {
            return or__3548__auto____33838
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__33843 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33839 = coll;
      if(cljs.core.truth_(and__3546__auto____33839)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____33839
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____33840 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____33840)) {
          return or__3548__auto____33840
        }else {
          var or__3548__auto____33841 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____33841)) {
            return or__3548__auto____33841
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
        return _nth__33842.call(this, coll, n);
      case 3:
        return _nth__33843.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33845 = coll;
    if(cljs.core.truth_(and__3546__auto____33845)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____33845
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____33846 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33846)) {
        return or__3548__auto____33846
      }else {
        var or__3548__auto____33847 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____33847)) {
          return or__3548__auto____33847
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33848 = coll;
    if(cljs.core.truth_(and__3546__auto____33848)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____33848
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____33849 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33849)) {
        return or__3548__auto____33849
      }else {
        var or__3548__auto____33850 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____33850)) {
          return or__3548__auto____33850
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
  var _lookup__33857 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33851 = o;
      if(cljs.core.truth_(and__3546__auto____33851)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____33851
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____33852 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____33852)) {
          return or__3548__auto____33852
        }else {
          var or__3548__auto____33853 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____33853)) {
            return or__3548__auto____33853
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__33858 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33854 = o;
      if(cljs.core.truth_(and__3546__auto____33854)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____33854
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____33855 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____33855)) {
          return or__3548__auto____33855
        }else {
          var or__3548__auto____33856 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____33856)) {
            return or__3548__auto____33856
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
        return _lookup__33857.call(this, o, k);
      case 3:
        return _lookup__33858.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33860 = coll;
    if(cljs.core.truth_(and__3546__auto____33860)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____33860
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____33861 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33861)) {
        return or__3548__auto____33861
      }else {
        var or__3548__auto____33862 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____33862)) {
          return or__3548__auto____33862
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33863 = coll;
    if(cljs.core.truth_(and__3546__auto____33863)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____33863
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____33864 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33864)) {
        return or__3548__auto____33864
      }else {
        var or__3548__auto____33865 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____33865)) {
          return or__3548__auto____33865
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
    var and__3546__auto____33866 = coll;
    if(cljs.core.truth_(and__3546__auto____33866)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____33866
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____33867 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33867)) {
        return or__3548__auto____33867
      }else {
        var or__3548__auto____33868 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____33868)) {
          return or__3548__auto____33868
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
    var and__3546__auto____33869 = coll;
    if(cljs.core.truth_(and__3546__auto____33869)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____33869
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____33870 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33870)) {
        return or__3548__auto____33870
      }else {
        var or__3548__auto____33871 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____33871)) {
          return or__3548__auto____33871
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
    var and__3546__auto____33872 = coll;
    if(cljs.core.truth_(and__3546__auto____33872)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____33872
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____33873 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33873)) {
        return or__3548__auto____33873
      }else {
        var or__3548__auto____33874 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____33874)) {
          return or__3548__auto____33874
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33875 = coll;
    if(cljs.core.truth_(and__3546__auto____33875)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____33875
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____33876 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33876)) {
        return or__3548__auto____33876
      }else {
        var or__3548__auto____33877 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____33877)) {
          return or__3548__auto____33877
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
    var and__3546__auto____33878 = coll;
    if(cljs.core.truth_(and__3546__auto____33878)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____33878
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____33879 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____33879)) {
        return or__3548__auto____33879
      }else {
        var or__3548__auto____33880 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____33880)) {
          return or__3548__auto____33880
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
    var and__3546__auto____33881 = o;
    if(cljs.core.truth_(and__3546__auto____33881)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____33881
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____33882 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____33882)) {
        return or__3548__auto____33882
      }else {
        var or__3548__auto____33883 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____33883)) {
          return or__3548__auto____33883
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
    var and__3546__auto____33884 = o;
    if(cljs.core.truth_(and__3546__auto____33884)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____33884
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____33885 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____33885)) {
        return or__3548__auto____33885
      }else {
        var or__3548__auto____33886 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____33886)) {
          return or__3548__auto____33886
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
    var and__3546__auto____33887 = o;
    if(cljs.core.truth_(and__3546__auto____33887)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____33887
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____33888 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____33888)) {
        return or__3548__auto____33888
      }else {
        var or__3548__auto____33889 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____33889)) {
          return or__3548__auto____33889
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
    var and__3546__auto____33890 = o;
    if(cljs.core.truth_(and__3546__auto____33890)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____33890
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____33891 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____33891)) {
        return or__3548__auto____33891
      }else {
        var or__3548__auto____33892 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____33892)) {
          return or__3548__auto____33892
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
  var _reduce__33899 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33893 = coll;
      if(cljs.core.truth_(and__3546__auto____33893)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____33893
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____33894 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____33894)) {
          return or__3548__auto____33894
        }else {
          var or__3548__auto____33895 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____33895)) {
            return or__3548__auto____33895
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__33900 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____33896 = coll;
      if(cljs.core.truth_(and__3546__auto____33896)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____33896
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____33897 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____33897)) {
          return or__3548__auto____33897
        }else {
          var or__3548__auto____33898 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____33898)) {
            return or__3548__auto____33898
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
        return _reduce__33899.call(this, coll, f);
      case 3:
        return _reduce__33900.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33902 = o;
    if(cljs.core.truth_(and__3546__auto____33902)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____33902
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____33903 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____33903)) {
        return or__3548__auto____33903
      }else {
        var or__3548__auto____33904 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____33904)) {
          return or__3548__auto____33904
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
    var and__3546__auto____33905 = o;
    if(cljs.core.truth_(and__3546__auto____33905)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____33905
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____33906 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____33906)) {
        return or__3548__auto____33906
      }else {
        var or__3548__auto____33907 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____33907)) {
          return or__3548__auto____33907
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
    var and__3546__auto____33908 = o;
    if(cljs.core.truth_(and__3546__auto____33908)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____33908
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____33909 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____33909)) {
        return or__3548__auto____33909
      }else {
        var or__3548__auto____33910 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____33910)) {
          return or__3548__auto____33910
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
    var and__3546__auto____33911 = o;
    if(cljs.core.truth_(and__3546__auto____33911)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____33911
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____33912 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____33912)) {
        return or__3548__auto____33912
      }else {
        var or__3548__auto____33913 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____33913)) {
          return or__3548__auto____33913
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
    var and__3546__auto____33914 = d;
    if(cljs.core.truth_(and__3546__auto____33914)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____33914
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____33915 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____33915)) {
        return or__3548__auto____33915
      }else {
        var or__3548__auto____33916 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____33916)) {
          return or__3548__auto____33916
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
    var and__3546__auto____33917 = this$;
    if(cljs.core.truth_(and__3546__auto____33917)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____33917
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____33918 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____33918)) {
        return or__3548__auto____33918
      }else {
        var or__3548__auto____33919 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____33919)) {
          return or__3548__auto____33919
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33920 = this$;
    if(cljs.core.truth_(and__3546__auto____33920)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____33920
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____33921 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____33921)) {
        return or__3548__auto____33921
      }else {
        var or__3548__auto____33922 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____33922)) {
          return or__3548__auto____33922
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____33923 = this$;
    if(cljs.core.truth_(and__3546__auto____33923)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____33923
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____33924 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____33924)) {
        return or__3548__auto____33924
      }else {
        var or__3548__auto____33925 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____33925)) {
          return or__3548__auto____33925
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
  var G__33926 = null;
  var G__33926__33927 = function(o, k) {
    return null
  };
  var G__33926__33928 = function(o, k, not_found) {
    return not_found
  };
  G__33926 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__33926__33927.call(this, o, k);
      case 3:
        return G__33926__33928.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33926
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
  var G__33930 = null;
  var G__33930__33931 = function(_, f) {
    return f.call(null)
  };
  var G__33930__33932 = function(_, f, start) {
    return start
  };
  G__33930 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__33930__33931.call(this, _, f);
      case 3:
        return G__33930__33932.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33930
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
  var G__33934 = null;
  var G__33934__33935 = function(_, n) {
    return null
  };
  var G__33934__33936 = function(_, n, not_found) {
    return not_found
  };
  G__33934 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__33934__33935.call(this, _, n);
      case 3:
        return G__33934__33936.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33934
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
  var ci_reduce__33944 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__33938 = cljs.core._nth.call(null, cicoll, 0);
      var n__33939 = 1;
      while(true) {
        if(cljs.core.truth_(n__33939 < cljs.core._count.call(null, cicoll))) {
          var G__33948 = f.call(null, val__33938, cljs.core._nth.call(null, cicoll, n__33939));
          var G__33949 = n__33939 + 1;
          val__33938 = G__33948;
          n__33939 = G__33949;
          continue
        }else {
          return val__33938
        }
        break
      }
    }
  };
  var ci_reduce__33945 = function(cicoll, f, val) {
    var val__33940 = val;
    var n__33941 = 0;
    while(true) {
      if(cljs.core.truth_(n__33941 < cljs.core._count.call(null, cicoll))) {
        var G__33950 = f.call(null, val__33940, cljs.core._nth.call(null, cicoll, n__33941));
        var G__33951 = n__33941 + 1;
        val__33940 = G__33950;
        n__33941 = G__33951;
        continue
      }else {
        return val__33940
      }
      break
    }
  };
  var ci_reduce__33946 = function(cicoll, f, val, idx) {
    var val__33942 = val;
    var n__33943 = idx;
    while(true) {
      if(cljs.core.truth_(n__33943 < cljs.core._count.call(null, cicoll))) {
        var G__33952 = f.call(null, val__33942, cljs.core._nth.call(null, cicoll, n__33943));
        var G__33953 = n__33943 + 1;
        val__33942 = G__33952;
        n__33943 = G__33953;
        continue
      }else {
        return val__33942
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__33944.call(this, cicoll, f);
      case 3:
        return ci_reduce__33945.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__33946.call(this, cicoll, f, val, idx)
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
  var this__33954 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__33967 = null;
  var G__33967__33968 = function(_, f) {
    var this__33955 = this;
    return cljs.core.ci_reduce.call(null, this__33955.a, f, this__33955.a[this__33955.i], this__33955.i + 1)
  };
  var G__33967__33969 = function(_, f, start) {
    var this__33956 = this;
    return cljs.core.ci_reduce.call(null, this__33956.a, f, start, this__33956.i)
  };
  G__33967 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__33967__33968.call(this, _, f);
      case 3:
        return G__33967__33969.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33967
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__33957 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__33958 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__33971 = null;
  var G__33971__33972 = function(coll, n) {
    var this__33959 = this;
    var i__33960 = n + this__33959.i;
    if(cljs.core.truth_(i__33960 < this__33959.a.length)) {
      return this__33959.a[i__33960]
    }else {
      return null
    }
  };
  var G__33971__33973 = function(coll, n, not_found) {
    var this__33961 = this;
    var i__33962 = n + this__33961.i;
    if(cljs.core.truth_(i__33962 < this__33961.a.length)) {
      return this__33961.a[i__33962]
    }else {
      return not_found
    }
  };
  G__33971 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__33971__33972.call(this, coll, n);
      case 3:
        return G__33971__33973.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33971
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__33963 = this;
  return this__33963.a.length - this__33963.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__33964 = this;
  return this__33964.a[this__33964.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__33965 = this;
  if(cljs.core.truth_(this__33965.i + 1 < this__33965.a.length)) {
    return new cljs.core.IndexedSeq(this__33965.a, this__33965.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__33966 = this;
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
  var G__33975 = null;
  var G__33975__33976 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__33975__33977 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__33975 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__33975__33976.call(this, array, f);
      case 3:
        return G__33975__33977.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33975
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__33979 = null;
  var G__33979__33980 = function(array, k) {
    return array[k]
  };
  var G__33979__33981 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__33979 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__33979__33980.call(this, array, k);
      case 3:
        return G__33979__33981.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33979
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__33983 = null;
  var G__33983__33984 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__33983__33985 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__33983 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__33983__33984.call(this, array, n);
      case 3:
        return G__33983__33985.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33983
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
  var temp__3698__auto____33987 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____33987)) {
    var s__33988 = temp__3698__auto____33987;
    return cljs.core._first.call(null, s__33988)
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
      var G__33989 = cljs.core.next.call(null, s);
      s = G__33989;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__33990 = cljs.core.seq.call(null, x);
  var n__33991 = 0;
  while(true) {
    if(cljs.core.truth_(s__33990)) {
      var G__33992 = cljs.core.next.call(null, s__33990);
      var G__33993 = n__33991 + 1;
      s__33990 = G__33992;
      n__33991 = G__33993;
      continue
    }else {
      return n__33991
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
  var conj__33994 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__33995 = function() {
    var G__33997__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__33998 = conj.call(null, coll, x);
          var G__33999 = cljs.core.first.call(null, xs);
          var G__34000 = cljs.core.next.call(null, xs);
          coll = G__33998;
          x = G__33999;
          xs = G__34000;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__33997 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__33997__delegate.call(this, coll, x, xs)
    };
    G__33997.cljs$lang$maxFixedArity = 2;
    G__33997.cljs$lang$applyTo = function(arglist__34001) {
      var coll = cljs.core.first(arglist__34001);
      var x = cljs.core.first(cljs.core.next(arglist__34001));
      var xs = cljs.core.rest(cljs.core.next(arglist__34001));
      return G__33997__delegate.call(this, coll, x, xs)
    };
    return G__33997
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__33994.call(this, coll, x);
      default:
        return conj__33995.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__33995.cljs$lang$applyTo;
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
  var nth__34002 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__34003 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__34002.call(this, coll, n);
      case 3:
        return nth__34003.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__34005 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__34006 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__34005.call(this, o, k);
      case 3:
        return get__34006.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__34009 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__34010 = function() {
    var G__34012__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__34008 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__34013 = ret__34008;
          var G__34014 = cljs.core.first.call(null, kvs);
          var G__34015 = cljs.core.second.call(null, kvs);
          var G__34016 = cljs.core.nnext.call(null, kvs);
          coll = G__34013;
          k = G__34014;
          v = G__34015;
          kvs = G__34016;
          continue
        }else {
          return ret__34008
        }
        break
      }
    };
    var G__34012 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__34012__delegate.call(this, coll, k, v, kvs)
    };
    G__34012.cljs$lang$maxFixedArity = 3;
    G__34012.cljs$lang$applyTo = function(arglist__34017) {
      var coll = cljs.core.first(arglist__34017);
      var k = cljs.core.first(cljs.core.next(arglist__34017));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34017)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34017)));
      return G__34012__delegate.call(this, coll, k, v, kvs)
    };
    return G__34012
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__34009.call(this, coll, k, v);
      default:
        return assoc__34010.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__34010.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__34019 = function(coll) {
    return coll
  };
  var dissoc__34020 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__34021 = function() {
    var G__34023__delegate = function(coll, k, ks) {
      while(true) {
        var ret__34018 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__34024 = ret__34018;
          var G__34025 = cljs.core.first.call(null, ks);
          var G__34026 = cljs.core.next.call(null, ks);
          coll = G__34024;
          k = G__34025;
          ks = G__34026;
          continue
        }else {
          return ret__34018
        }
        break
      }
    };
    var G__34023 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34023__delegate.call(this, coll, k, ks)
    };
    G__34023.cljs$lang$maxFixedArity = 2;
    G__34023.cljs$lang$applyTo = function(arglist__34027) {
      var coll = cljs.core.first(arglist__34027);
      var k = cljs.core.first(cljs.core.next(arglist__34027));
      var ks = cljs.core.rest(cljs.core.next(arglist__34027));
      return G__34023__delegate.call(this, coll, k, ks)
    };
    return G__34023
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__34019.call(this, coll);
      case 2:
        return dissoc__34020.call(this, coll, k);
      default:
        return dissoc__34021.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__34021.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__450__auto____34028 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____34029 = x__450__auto____34028;
      if(cljs.core.truth_(and__3546__auto____34029)) {
        var and__3546__auto____34030 = x__450__auto____34028.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____34030)) {
          return cljs.core.not.call(null, x__450__auto____34028.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____34030
        }
      }else {
        return and__3546__auto____34029
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____34028)
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
  var disj__34032 = function(coll) {
    return coll
  };
  var disj__34033 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__34034 = function() {
    var G__34036__delegate = function(coll, k, ks) {
      while(true) {
        var ret__34031 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__34037 = ret__34031;
          var G__34038 = cljs.core.first.call(null, ks);
          var G__34039 = cljs.core.next.call(null, ks);
          coll = G__34037;
          k = G__34038;
          ks = G__34039;
          continue
        }else {
          return ret__34031
        }
        break
      }
    };
    var G__34036 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34036__delegate.call(this, coll, k, ks)
    };
    G__34036.cljs$lang$maxFixedArity = 2;
    G__34036.cljs$lang$applyTo = function(arglist__34040) {
      var coll = cljs.core.first(arglist__34040);
      var k = cljs.core.first(cljs.core.next(arglist__34040));
      var ks = cljs.core.rest(cljs.core.next(arglist__34040));
      return G__34036__delegate.call(this, coll, k, ks)
    };
    return G__34036
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__34032.call(this, coll);
      case 2:
        return disj__34033.call(this, coll, k);
      default:
        return disj__34034.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__34034.cljs$lang$applyTo;
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
    var x__450__auto____34041 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____34042 = x__450__auto____34041;
      if(cljs.core.truth_(and__3546__auto____34042)) {
        var and__3546__auto____34043 = x__450__auto____34041.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____34043)) {
          return cljs.core.not.call(null, x__450__auto____34041.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____34043
        }
      }else {
        return and__3546__auto____34042
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__450__auto____34041)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____34044 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____34045 = x__450__auto____34044;
      if(cljs.core.truth_(and__3546__auto____34045)) {
        var and__3546__auto____34046 = x__450__auto____34044.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____34046)) {
          return cljs.core.not.call(null, x__450__auto____34044.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____34046
        }
      }else {
        return and__3546__auto____34045
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__450__auto____34044)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__450__auto____34047 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____34048 = x__450__auto____34047;
    if(cljs.core.truth_(and__3546__auto____34048)) {
      var and__3546__auto____34049 = x__450__auto____34047.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____34049)) {
        return cljs.core.not.call(null, x__450__auto____34047.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____34049
      }
    }else {
      return and__3546__auto____34048
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__450__auto____34047)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__450__auto____34050 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____34051 = x__450__auto____34050;
    if(cljs.core.truth_(and__3546__auto____34051)) {
      var and__3546__auto____34052 = x__450__auto____34050.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____34052)) {
        return cljs.core.not.call(null, x__450__auto____34050.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____34052
      }
    }else {
      return and__3546__auto____34051
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__450__auto____34050)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__450__auto____34053 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____34054 = x__450__auto____34053;
    if(cljs.core.truth_(and__3546__auto____34054)) {
      var and__3546__auto____34055 = x__450__auto____34053.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____34055)) {
        return cljs.core.not.call(null, x__450__auto____34053.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____34055
      }
    }else {
      return and__3546__auto____34054
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__450__auto____34053)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____34056 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____34057 = x__450__auto____34056;
      if(cljs.core.truth_(and__3546__auto____34057)) {
        var and__3546__auto____34058 = x__450__auto____34056.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____34058)) {
          return cljs.core.not.call(null, x__450__auto____34056.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____34058
        }
      }else {
        return and__3546__auto____34057
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__450__auto____34056)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__450__auto____34059 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____34060 = x__450__auto____34059;
    if(cljs.core.truth_(and__3546__auto____34060)) {
      var and__3546__auto____34061 = x__450__auto____34059.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____34061)) {
        return cljs.core.not.call(null, x__450__auto____34059.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____34061
      }
    }else {
      return and__3546__auto____34060
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__450__auto____34059)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__34062 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__34062.push(key)
  });
  return keys__34062
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
    var x__450__auto____34063 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____34064 = x__450__auto____34063;
      if(cljs.core.truth_(and__3546__auto____34064)) {
        var and__3546__auto____34065 = x__450__auto____34063.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____34065)) {
          return cljs.core.not.call(null, x__450__auto____34063.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____34065
        }
      }else {
        return and__3546__auto____34064
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__450__auto____34063)
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
  var and__3546__auto____34066 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____34066)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____34067 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____34067)) {
        return or__3548__auto____34067
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____34066
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____34068 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____34068)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____34068
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____34069 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____34069)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____34069
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____34070 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____34070)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____34070
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
    var and__3546__auto____34071 = coll;
    if(cljs.core.truth_(and__3546__auto____34071)) {
      var and__3546__auto____34072 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____34072)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____34072
      }
    }else {
      return and__3546__auto____34071
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___34077 = function(x) {
    return true
  };
  var distinct_QMARK___34078 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___34079 = function() {
    var G__34081__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__34073 = cljs.core.set([y, x]);
        var xs__34074 = more;
        while(true) {
          var x__34075 = cljs.core.first.call(null, xs__34074);
          var etc__34076 = cljs.core.next.call(null, xs__34074);
          if(cljs.core.truth_(xs__34074)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__34073, x__34075))) {
              return false
            }else {
              var G__34082 = cljs.core.conj.call(null, s__34073, x__34075);
              var G__34083 = etc__34076;
              s__34073 = G__34082;
              xs__34074 = G__34083;
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
    var G__34081 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34081__delegate.call(this, x, y, more)
    };
    G__34081.cljs$lang$maxFixedArity = 2;
    G__34081.cljs$lang$applyTo = function(arglist__34084) {
      var x = cljs.core.first(arglist__34084);
      var y = cljs.core.first(cljs.core.next(arglist__34084));
      var more = cljs.core.rest(cljs.core.next(arglist__34084));
      return G__34081__delegate.call(this, x, y, more)
    };
    return G__34081
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___34077.call(this, x);
      case 2:
        return distinct_QMARK___34078.call(this, x, y);
      default:
        return distinct_QMARK___34079.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___34079.cljs$lang$applyTo;
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
      var r__34085 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__34085))) {
        return r__34085
      }else {
        if(cljs.core.truth_(r__34085)) {
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
  var sort__34087 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__34088 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__34086 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__34086, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__34086)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__34087.call(this, comp);
      case 2:
        return sort__34088.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__34090 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__34091 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__34090.call(this, keyfn, comp);
      case 3:
        return sort_by__34091.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__34093 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__34094 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__34093.call(this, f, val);
      case 3:
        return reduce__34094.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__34100 = function(f, coll) {
    var temp__3695__auto____34096 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____34096)) {
      var s__34097 = temp__3695__auto____34096;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__34097), cljs.core.next.call(null, s__34097))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__34101 = function(f, val, coll) {
    var val__34098 = val;
    var coll__34099 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__34099)) {
        var G__34103 = f.call(null, val__34098, cljs.core.first.call(null, coll__34099));
        var G__34104 = cljs.core.next.call(null, coll__34099);
        val__34098 = G__34103;
        coll__34099 = G__34104;
        continue
      }else {
        return val__34098
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__34100.call(this, f, val);
      case 3:
        return seq_reduce__34101.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__34105 = null;
  var G__34105__34106 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__34105__34107 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__34105 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__34105__34106.call(this, coll, f);
      case 3:
        return G__34105__34107.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34105
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___34109 = function() {
    return 0
  };
  var _PLUS___34110 = function(x) {
    return x
  };
  var _PLUS___34111 = function(x, y) {
    return x + y
  };
  var _PLUS___34112 = function() {
    var G__34114__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__34114 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34114__delegate.call(this, x, y, more)
    };
    G__34114.cljs$lang$maxFixedArity = 2;
    G__34114.cljs$lang$applyTo = function(arglist__34115) {
      var x = cljs.core.first(arglist__34115);
      var y = cljs.core.first(cljs.core.next(arglist__34115));
      var more = cljs.core.rest(cljs.core.next(arglist__34115));
      return G__34114__delegate.call(this, x, y, more)
    };
    return G__34114
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___34109.call(this);
      case 1:
        return _PLUS___34110.call(this, x);
      case 2:
        return _PLUS___34111.call(this, x, y);
      default:
        return _PLUS___34112.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___34112.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___34116 = function(x) {
    return-x
  };
  var ___34117 = function(x, y) {
    return x - y
  };
  var ___34118 = function() {
    var G__34120__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__34120 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34120__delegate.call(this, x, y, more)
    };
    G__34120.cljs$lang$maxFixedArity = 2;
    G__34120.cljs$lang$applyTo = function(arglist__34121) {
      var x = cljs.core.first(arglist__34121);
      var y = cljs.core.first(cljs.core.next(arglist__34121));
      var more = cljs.core.rest(cljs.core.next(arglist__34121));
      return G__34120__delegate.call(this, x, y, more)
    };
    return G__34120
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___34116.call(this, x);
      case 2:
        return ___34117.call(this, x, y);
      default:
        return ___34118.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___34118.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___34122 = function() {
    return 1
  };
  var _STAR___34123 = function(x) {
    return x
  };
  var _STAR___34124 = function(x, y) {
    return x * y
  };
  var _STAR___34125 = function() {
    var G__34127__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__34127 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34127__delegate.call(this, x, y, more)
    };
    G__34127.cljs$lang$maxFixedArity = 2;
    G__34127.cljs$lang$applyTo = function(arglist__34128) {
      var x = cljs.core.first(arglist__34128);
      var y = cljs.core.first(cljs.core.next(arglist__34128));
      var more = cljs.core.rest(cljs.core.next(arglist__34128));
      return G__34127__delegate.call(this, x, y, more)
    };
    return G__34127
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___34122.call(this);
      case 1:
        return _STAR___34123.call(this, x);
      case 2:
        return _STAR___34124.call(this, x, y);
      default:
        return _STAR___34125.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___34125.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___34129 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___34130 = function(x, y) {
    return x / y
  };
  var _SLASH___34131 = function() {
    var G__34133__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__34133 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34133__delegate.call(this, x, y, more)
    };
    G__34133.cljs$lang$maxFixedArity = 2;
    G__34133.cljs$lang$applyTo = function(arglist__34134) {
      var x = cljs.core.first(arglist__34134);
      var y = cljs.core.first(cljs.core.next(arglist__34134));
      var more = cljs.core.rest(cljs.core.next(arglist__34134));
      return G__34133__delegate.call(this, x, y, more)
    };
    return G__34133
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___34129.call(this, x);
      case 2:
        return _SLASH___34130.call(this, x, y);
      default:
        return _SLASH___34131.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___34131.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___34135 = function(x) {
    return true
  };
  var _LT___34136 = function(x, y) {
    return x < y
  };
  var _LT___34137 = function() {
    var G__34139__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__34140 = y;
            var G__34141 = cljs.core.first.call(null, more);
            var G__34142 = cljs.core.next.call(null, more);
            x = G__34140;
            y = G__34141;
            more = G__34142;
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
    var G__34139 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34139__delegate.call(this, x, y, more)
    };
    G__34139.cljs$lang$maxFixedArity = 2;
    G__34139.cljs$lang$applyTo = function(arglist__34143) {
      var x = cljs.core.first(arglist__34143);
      var y = cljs.core.first(cljs.core.next(arglist__34143));
      var more = cljs.core.rest(cljs.core.next(arglist__34143));
      return G__34139__delegate.call(this, x, y, more)
    };
    return G__34139
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___34135.call(this, x);
      case 2:
        return _LT___34136.call(this, x, y);
      default:
        return _LT___34137.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___34137.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___34144 = function(x) {
    return true
  };
  var _LT__EQ___34145 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___34146 = function() {
    var G__34148__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__34149 = y;
            var G__34150 = cljs.core.first.call(null, more);
            var G__34151 = cljs.core.next.call(null, more);
            x = G__34149;
            y = G__34150;
            more = G__34151;
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
    var G__34148 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34148__delegate.call(this, x, y, more)
    };
    G__34148.cljs$lang$maxFixedArity = 2;
    G__34148.cljs$lang$applyTo = function(arglist__34152) {
      var x = cljs.core.first(arglist__34152);
      var y = cljs.core.first(cljs.core.next(arglist__34152));
      var more = cljs.core.rest(cljs.core.next(arglist__34152));
      return G__34148__delegate.call(this, x, y, more)
    };
    return G__34148
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___34144.call(this, x);
      case 2:
        return _LT__EQ___34145.call(this, x, y);
      default:
        return _LT__EQ___34146.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___34146.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___34153 = function(x) {
    return true
  };
  var _GT___34154 = function(x, y) {
    return x > y
  };
  var _GT___34155 = function() {
    var G__34157__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__34158 = y;
            var G__34159 = cljs.core.first.call(null, more);
            var G__34160 = cljs.core.next.call(null, more);
            x = G__34158;
            y = G__34159;
            more = G__34160;
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
    var G__34157 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34157__delegate.call(this, x, y, more)
    };
    G__34157.cljs$lang$maxFixedArity = 2;
    G__34157.cljs$lang$applyTo = function(arglist__34161) {
      var x = cljs.core.first(arglist__34161);
      var y = cljs.core.first(cljs.core.next(arglist__34161));
      var more = cljs.core.rest(cljs.core.next(arglist__34161));
      return G__34157__delegate.call(this, x, y, more)
    };
    return G__34157
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___34153.call(this, x);
      case 2:
        return _GT___34154.call(this, x, y);
      default:
        return _GT___34155.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___34155.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___34162 = function(x) {
    return true
  };
  var _GT__EQ___34163 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___34164 = function() {
    var G__34166__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__34167 = y;
            var G__34168 = cljs.core.first.call(null, more);
            var G__34169 = cljs.core.next.call(null, more);
            x = G__34167;
            y = G__34168;
            more = G__34169;
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
    var G__34166 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34166__delegate.call(this, x, y, more)
    };
    G__34166.cljs$lang$maxFixedArity = 2;
    G__34166.cljs$lang$applyTo = function(arglist__34170) {
      var x = cljs.core.first(arglist__34170);
      var y = cljs.core.first(cljs.core.next(arglist__34170));
      var more = cljs.core.rest(cljs.core.next(arglist__34170));
      return G__34166__delegate.call(this, x, y, more)
    };
    return G__34166
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___34162.call(this, x);
      case 2:
        return _GT__EQ___34163.call(this, x, y);
      default:
        return _GT__EQ___34164.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___34164.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__34171 = function(x) {
    return x
  };
  var max__34172 = function(x, y) {
    return x > y ? x : y
  };
  var max__34173 = function() {
    var G__34175__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__34175 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34175__delegate.call(this, x, y, more)
    };
    G__34175.cljs$lang$maxFixedArity = 2;
    G__34175.cljs$lang$applyTo = function(arglist__34176) {
      var x = cljs.core.first(arglist__34176);
      var y = cljs.core.first(cljs.core.next(arglist__34176));
      var more = cljs.core.rest(cljs.core.next(arglist__34176));
      return G__34175__delegate.call(this, x, y, more)
    };
    return G__34175
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__34171.call(this, x);
      case 2:
        return max__34172.call(this, x, y);
      default:
        return max__34173.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__34173.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__34177 = function(x) {
    return x
  };
  var min__34178 = function(x, y) {
    return x < y ? x : y
  };
  var min__34179 = function() {
    var G__34181__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__34181 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34181__delegate.call(this, x, y, more)
    };
    G__34181.cljs$lang$maxFixedArity = 2;
    G__34181.cljs$lang$applyTo = function(arglist__34182) {
      var x = cljs.core.first(arglist__34182);
      var y = cljs.core.first(cljs.core.next(arglist__34182));
      var more = cljs.core.rest(cljs.core.next(arglist__34182));
      return G__34181__delegate.call(this, x, y, more)
    };
    return G__34181
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__34177.call(this, x);
      case 2:
        return min__34178.call(this, x, y);
      default:
        return min__34179.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__34179.cljs$lang$applyTo;
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
  var rem__34183 = n % d;
  return cljs.core.fix.call(null, (n - rem__34183) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__34184 = cljs.core.quot.call(null, n, d);
  return n - d * q__34184
};
cljs.core.rand = function() {
  var rand = null;
  var rand__34185 = function() {
    return Math.random.call(null)
  };
  var rand__34186 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__34185.call(this);
      case 1:
        return rand__34186.call(this, n)
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
  var _EQ__EQ___34188 = function(x) {
    return true
  };
  var _EQ__EQ___34189 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___34190 = function() {
    var G__34192__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__34193 = y;
            var G__34194 = cljs.core.first.call(null, more);
            var G__34195 = cljs.core.next.call(null, more);
            x = G__34193;
            y = G__34194;
            more = G__34195;
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
    var G__34192 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34192__delegate.call(this, x, y, more)
    };
    G__34192.cljs$lang$maxFixedArity = 2;
    G__34192.cljs$lang$applyTo = function(arglist__34196) {
      var x = cljs.core.first(arglist__34196);
      var y = cljs.core.first(cljs.core.next(arglist__34196));
      var more = cljs.core.rest(cljs.core.next(arglist__34196));
      return G__34192__delegate.call(this, x, y, more)
    };
    return G__34192
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___34188.call(this, x);
      case 2:
        return _EQ__EQ___34189.call(this, x, y);
      default:
        return _EQ__EQ___34190.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___34190.cljs$lang$applyTo;
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
  var n__34197 = n;
  var xs__34198 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____34199 = xs__34198;
      if(cljs.core.truth_(and__3546__auto____34199)) {
        return n__34197 > 0
      }else {
        return and__3546__auto____34199
      }
    }())) {
      var G__34200 = n__34197 - 1;
      var G__34201 = cljs.core.next.call(null, xs__34198);
      n__34197 = G__34200;
      xs__34198 = G__34201;
      continue
    }else {
      return xs__34198
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__34206 = null;
  var G__34206__34207 = function(coll, n) {
    var temp__3695__auto____34202 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____34202)) {
      var xs__34203 = temp__3695__auto____34202;
      return cljs.core.first.call(null, xs__34203)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__34206__34208 = function(coll, n, not_found) {
    var temp__3695__auto____34204 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____34204)) {
      var xs__34205 = temp__3695__auto____34204;
      return cljs.core.first.call(null, xs__34205)
    }else {
      return not_found
    }
  };
  G__34206 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34206__34207.call(this, coll, n);
      case 3:
        return G__34206__34208.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34206
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___34210 = function() {
    return""
  };
  var str_STAR___34211 = function(x) {
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
  var str_STAR___34212 = function() {
    var G__34214__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__34215 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__34216 = cljs.core.next.call(null, more);
            sb = G__34215;
            more = G__34216;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__34214 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__34214__delegate.call(this, x, ys)
    };
    G__34214.cljs$lang$maxFixedArity = 1;
    G__34214.cljs$lang$applyTo = function(arglist__34217) {
      var x = cljs.core.first(arglist__34217);
      var ys = cljs.core.rest(arglist__34217);
      return G__34214__delegate.call(this, x, ys)
    };
    return G__34214
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___34210.call(this);
      case 1:
        return str_STAR___34211.call(this, x);
      default:
        return str_STAR___34212.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___34212.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__34218 = function() {
    return""
  };
  var str__34219 = function(x) {
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
  var str__34220 = function() {
    var G__34222__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__34222 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__34222__delegate.call(this, x, ys)
    };
    G__34222.cljs$lang$maxFixedArity = 1;
    G__34222.cljs$lang$applyTo = function(arglist__34223) {
      var x = cljs.core.first(arglist__34223);
      var ys = cljs.core.rest(arglist__34223);
      return G__34222__delegate.call(this, x, ys)
    };
    return G__34222
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__34218.call(this);
      case 1:
        return str__34219.call(this, x);
      default:
        return str__34220.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__34220.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__34224 = function(s, start) {
    return s.substring(start)
  };
  var subs__34225 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__34224.call(this, s, start);
      case 3:
        return subs__34225.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__34227 = function(name) {
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
  var symbol__34228 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__34227.call(this, ns);
      case 2:
        return symbol__34228.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__34230 = function(name) {
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
  var keyword__34231 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__34230.call(this, ns);
      case 2:
        return keyword__34231.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__34233 = cljs.core.seq.call(null, x);
    var ys__34234 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__34233 === null)) {
        return ys__34234 === null
      }else {
        if(cljs.core.truth_(ys__34234 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__34233), cljs.core.first.call(null, ys__34234)))) {
            var G__34235 = cljs.core.next.call(null, xs__34233);
            var G__34236 = cljs.core.next.call(null, ys__34234);
            xs__34233 = G__34235;
            ys__34234 = G__34236;
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
  return cljs.core.reduce.call(null, function(p1__34237_SHARP_, p2__34238_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__34237_SHARP_, cljs.core.hash.call(null, p2__34238_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__34239__34240 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__34239__34240)) {
    var G__34242__34244 = cljs.core.first.call(null, G__34239__34240);
    var vec__34243__34245 = G__34242__34244;
    var key_name__34246 = cljs.core.nth.call(null, vec__34243__34245, 0, null);
    var f__34247 = cljs.core.nth.call(null, vec__34243__34245, 1, null);
    var G__34239__34248 = G__34239__34240;
    var G__34242__34249 = G__34242__34244;
    var G__34239__34250 = G__34239__34248;
    while(true) {
      var vec__34251__34252 = G__34242__34249;
      var key_name__34253 = cljs.core.nth.call(null, vec__34251__34252, 0, null);
      var f__34254 = cljs.core.nth.call(null, vec__34251__34252, 1, null);
      var G__34239__34255 = G__34239__34250;
      var str_name__34256 = cljs.core.name.call(null, key_name__34253);
      obj[str_name__34256] = f__34254;
      var temp__3698__auto____34257 = cljs.core.next.call(null, G__34239__34255);
      if(cljs.core.truth_(temp__3698__auto____34257)) {
        var G__34239__34258 = temp__3698__auto____34257;
        var G__34259 = cljs.core.first.call(null, G__34239__34258);
        var G__34260 = G__34239__34258;
        G__34242__34249 = G__34259;
        G__34239__34250 = G__34260;
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
  var this__34261 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__34262 = this;
  return new cljs.core.List(this__34262.meta, o, coll, this__34262.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__34263 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__34264 = this;
  return this__34264.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__34265 = this;
  return this__34265.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__34266 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__34267 = this;
  return this__34267.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__34268 = this;
  return this__34268.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34269 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34270 = this;
  return new cljs.core.List(meta, this__34270.first, this__34270.rest, this__34270.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34271 = this;
  return this__34271.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34272 = this;
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
  var this__34273 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__34274 = this;
  return new cljs.core.List(this__34274.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__34275 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__34276 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__34277 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__34278 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__34279 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__34280 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34281 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34282 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34283 = this;
  return this__34283.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34284 = this;
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
  list.cljs$lang$applyTo = function(arglist__34285) {
    var items = cljs.core.seq(arglist__34285);
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
  var this__34286 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__34287 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34288 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34289 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__34289.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__34290 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__34291 = this;
  return this__34291.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__34292 = this;
  if(cljs.core.truth_(this__34292.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__34292.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34293 = this;
  return this__34293.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34294 = this;
  return new cljs.core.Cons(meta, this__34294.first, this__34294.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__34295 = null;
  var G__34295__34296 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__34295__34297 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__34295 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__34295__34296.call(this, string, f);
      case 3:
        return G__34295__34297.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34295
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__34299 = null;
  var G__34299__34300 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__34299__34301 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__34299 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34299__34300.call(this, string, k);
      case 3:
        return G__34299__34301.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34299
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__34303 = null;
  var G__34303__34304 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__34303__34305 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__34303 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34303__34304.call(this, string, n);
      case 3:
        return G__34303__34305.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34303
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
  var G__34313 = null;
  var G__34313__34314 = function(tsym34307, coll) {
    var tsym34307__34309 = this;
    var this$__34310 = tsym34307__34309;
    return cljs.core.get.call(null, coll, this$__34310.toString())
  };
  var G__34313__34315 = function(tsym34308, coll, not_found) {
    var tsym34308__34311 = this;
    var this$__34312 = tsym34308__34311;
    return cljs.core.get.call(null, coll, this$__34312.toString(), not_found)
  };
  G__34313 = function(tsym34308, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34313__34314.call(this, tsym34308, coll);
      case 3:
        return G__34313__34315.call(this, tsym34308, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34313
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__34317 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__34317
  }else {
    lazy_seq.x = x__34317.call(null);
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
  var this__34318 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__34319 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34320 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34321 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__34321.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__34322 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__34323 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__34324 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34325 = this;
  return this__34325.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34326 = this;
  return new cljs.core.LazySeq(meta, this__34326.realized, this__34326.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__34327 = cljs.core.array.call(null);
  var s__34328 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__34328))) {
      ary__34327.push(cljs.core.first.call(null, s__34328));
      var G__34329 = cljs.core.next.call(null, s__34328);
      s__34328 = G__34329;
      continue
    }else {
      return ary__34327
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__34330 = s;
  var i__34331 = n;
  var sum__34332 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____34333 = i__34331 > 0;
      if(cljs.core.truth_(and__3546__auto____34333)) {
        return cljs.core.seq.call(null, s__34330)
      }else {
        return and__3546__auto____34333
      }
    }())) {
      var G__34334 = cljs.core.next.call(null, s__34330);
      var G__34335 = i__34331 - 1;
      var G__34336 = sum__34332 + 1;
      s__34330 = G__34334;
      i__34331 = G__34335;
      sum__34332 = G__34336;
      continue
    }else {
      return sum__34332
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
  var concat__34340 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__34341 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__34342 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__34337 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__34337)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__34337), concat.call(null, cljs.core.rest.call(null, s__34337), y))
      }else {
        return y
      }
    })
  };
  var concat__34343 = function() {
    var G__34345__delegate = function(x, y, zs) {
      var cat__34339 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__34338 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__34338)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__34338), cat.call(null, cljs.core.rest.call(null, xys__34338), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__34339.call(null, concat.call(null, x, y), zs)
    };
    var G__34345 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34345__delegate.call(this, x, y, zs)
    };
    G__34345.cljs$lang$maxFixedArity = 2;
    G__34345.cljs$lang$applyTo = function(arglist__34346) {
      var x = cljs.core.first(arglist__34346);
      var y = cljs.core.first(cljs.core.next(arglist__34346));
      var zs = cljs.core.rest(cljs.core.next(arglist__34346));
      return G__34345__delegate.call(this, x, y, zs)
    };
    return G__34345
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__34340.call(this);
      case 1:
        return concat__34341.call(this, x);
      case 2:
        return concat__34342.call(this, x, y);
      default:
        return concat__34343.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__34343.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___34347 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___34348 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___34349 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___34350 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___34351 = function() {
    var G__34353__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__34353 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__34353__delegate.call(this, a, b, c, d, more)
    };
    G__34353.cljs$lang$maxFixedArity = 4;
    G__34353.cljs$lang$applyTo = function(arglist__34354) {
      var a = cljs.core.first(arglist__34354);
      var b = cljs.core.first(cljs.core.next(arglist__34354));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34354)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34354))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34354))));
      return G__34353__delegate.call(this, a, b, c, d, more)
    };
    return G__34353
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___34347.call(this, a);
      case 2:
        return list_STAR___34348.call(this, a, b);
      case 3:
        return list_STAR___34349.call(this, a, b, c);
      case 4:
        return list_STAR___34350.call(this, a, b, c, d);
      default:
        return list_STAR___34351.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___34351.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__34364 = function(f, args) {
    var fixed_arity__34355 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__34355 + 1) <= fixed_arity__34355)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__34365 = function(f, x, args) {
    var arglist__34356 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__34357 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__34356, fixed_arity__34357) <= fixed_arity__34357)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__34356))
      }else {
        return f.cljs$lang$applyTo(arglist__34356)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__34356))
    }
  };
  var apply__34366 = function(f, x, y, args) {
    var arglist__34358 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__34359 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__34358, fixed_arity__34359) <= fixed_arity__34359)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__34358))
      }else {
        return f.cljs$lang$applyTo(arglist__34358)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__34358))
    }
  };
  var apply__34367 = function(f, x, y, z, args) {
    var arglist__34360 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__34361 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__34360, fixed_arity__34361) <= fixed_arity__34361)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__34360))
      }else {
        return f.cljs$lang$applyTo(arglist__34360)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__34360))
    }
  };
  var apply__34368 = function() {
    var G__34370__delegate = function(f, a, b, c, d, args) {
      var arglist__34362 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__34363 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__34362, fixed_arity__34363) <= fixed_arity__34363)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__34362))
        }else {
          return f.cljs$lang$applyTo(arglist__34362)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__34362))
      }
    };
    var G__34370 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__34370__delegate.call(this, f, a, b, c, d, args)
    };
    G__34370.cljs$lang$maxFixedArity = 5;
    G__34370.cljs$lang$applyTo = function(arglist__34371) {
      var f = cljs.core.first(arglist__34371);
      var a = cljs.core.first(cljs.core.next(arglist__34371));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34371)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34371))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34371)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34371)))));
      return G__34370__delegate.call(this, f, a, b, c, d, args)
    };
    return G__34370
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__34364.call(this, f, a);
      case 3:
        return apply__34365.call(this, f, a, b);
      case 4:
        return apply__34366.call(this, f, a, b, c);
      case 5:
        return apply__34367.call(this, f, a, b, c, d);
      default:
        return apply__34368.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__34368.cljs$lang$applyTo;
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
  vary_meta.cljs$lang$applyTo = function(arglist__34372) {
    var obj = cljs.core.first(arglist__34372);
    var f = cljs.core.first(cljs.core.next(arglist__34372));
    var args = cljs.core.rest(cljs.core.next(arglist__34372));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___34373 = function(x) {
    return false
  };
  var not_EQ___34374 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___34375 = function() {
    var G__34377__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__34377 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34377__delegate.call(this, x, y, more)
    };
    G__34377.cljs$lang$maxFixedArity = 2;
    G__34377.cljs$lang$applyTo = function(arglist__34378) {
      var x = cljs.core.first(arglist__34378);
      var y = cljs.core.first(cljs.core.next(arglist__34378));
      var more = cljs.core.rest(cljs.core.next(arglist__34378));
      return G__34377__delegate.call(this, x, y, more)
    };
    return G__34377
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___34373.call(this, x);
      case 2:
        return not_EQ___34374.call(this, x, y);
      default:
        return not_EQ___34375.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___34375.cljs$lang$applyTo;
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
        var G__34379 = pred;
        var G__34380 = cljs.core.next.call(null, coll);
        pred = G__34379;
        coll = G__34380;
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
      var or__3548__auto____34381 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____34381)) {
        return or__3548__auto____34381
      }else {
        var G__34382 = pred;
        var G__34383 = cljs.core.next.call(null, coll);
        pred = G__34382;
        coll = G__34383;
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
    var G__34384 = null;
    var G__34384__34385 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__34384__34386 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__34384__34387 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__34384__34388 = function() {
      var G__34390__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__34390 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__34390__delegate.call(this, x, y, zs)
      };
      G__34390.cljs$lang$maxFixedArity = 2;
      G__34390.cljs$lang$applyTo = function(arglist__34391) {
        var x = cljs.core.first(arglist__34391);
        var y = cljs.core.first(cljs.core.next(arglist__34391));
        var zs = cljs.core.rest(cljs.core.next(arglist__34391));
        return G__34390__delegate.call(this, x, y, zs)
      };
      return G__34390
    }();
    G__34384 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__34384__34385.call(this);
        case 1:
          return G__34384__34386.call(this, x);
        case 2:
          return G__34384__34387.call(this, x, y);
        default:
          return G__34384__34388.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__34384.cljs$lang$maxFixedArity = 2;
    G__34384.cljs$lang$applyTo = G__34384__34388.cljs$lang$applyTo;
    return G__34384
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__34392__delegate = function(args) {
      return x
    };
    var G__34392 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__34392__delegate.call(this, args)
    };
    G__34392.cljs$lang$maxFixedArity = 0;
    G__34392.cljs$lang$applyTo = function(arglist__34393) {
      var args = cljs.core.seq(arglist__34393);
      return G__34392__delegate.call(this, args)
    };
    return G__34392
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__34397 = function() {
    return cljs.core.identity
  };
  var comp__34398 = function(f) {
    return f
  };
  var comp__34399 = function(f, g) {
    return function() {
      var G__34403 = null;
      var G__34403__34404 = function() {
        return f.call(null, g.call(null))
      };
      var G__34403__34405 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__34403__34406 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__34403__34407 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__34403__34408 = function() {
        var G__34410__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__34410 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34410__delegate.call(this, x, y, z, args)
        };
        G__34410.cljs$lang$maxFixedArity = 3;
        G__34410.cljs$lang$applyTo = function(arglist__34411) {
          var x = cljs.core.first(arglist__34411);
          var y = cljs.core.first(cljs.core.next(arglist__34411));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34411)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34411)));
          return G__34410__delegate.call(this, x, y, z, args)
        };
        return G__34410
      }();
      G__34403 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__34403__34404.call(this);
          case 1:
            return G__34403__34405.call(this, x);
          case 2:
            return G__34403__34406.call(this, x, y);
          case 3:
            return G__34403__34407.call(this, x, y, z);
          default:
            return G__34403__34408.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__34403.cljs$lang$maxFixedArity = 3;
      G__34403.cljs$lang$applyTo = G__34403__34408.cljs$lang$applyTo;
      return G__34403
    }()
  };
  var comp__34400 = function(f, g, h) {
    return function() {
      var G__34412 = null;
      var G__34412__34413 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__34412__34414 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__34412__34415 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__34412__34416 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__34412__34417 = function() {
        var G__34419__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__34419 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34419__delegate.call(this, x, y, z, args)
        };
        G__34419.cljs$lang$maxFixedArity = 3;
        G__34419.cljs$lang$applyTo = function(arglist__34420) {
          var x = cljs.core.first(arglist__34420);
          var y = cljs.core.first(cljs.core.next(arglist__34420));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34420)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34420)));
          return G__34419__delegate.call(this, x, y, z, args)
        };
        return G__34419
      }();
      G__34412 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__34412__34413.call(this);
          case 1:
            return G__34412__34414.call(this, x);
          case 2:
            return G__34412__34415.call(this, x, y);
          case 3:
            return G__34412__34416.call(this, x, y, z);
          default:
            return G__34412__34417.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__34412.cljs$lang$maxFixedArity = 3;
      G__34412.cljs$lang$applyTo = G__34412__34417.cljs$lang$applyTo;
      return G__34412
    }()
  };
  var comp__34401 = function() {
    var G__34421__delegate = function(f1, f2, f3, fs) {
      var fs__34394 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__34422__delegate = function(args) {
          var ret__34395 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__34394), args);
          var fs__34396 = cljs.core.next.call(null, fs__34394);
          while(true) {
            if(cljs.core.truth_(fs__34396)) {
              var G__34423 = cljs.core.first.call(null, fs__34396).call(null, ret__34395);
              var G__34424 = cljs.core.next.call(null, fs__34396);
              ret__34395 = G__34423;
              fs__34396 = G__34424;
              continue
            }else {
              return ret__34395
            }
            break
          }
        };
        var G__34422 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__34422__delegate.call(this, args)
        };
        G__34422.cljs$lang$maxFixedArity = 0;
        G__34422.cljs$lang$applyTo = function(arglist__34425) {
          var args = cljs.core.seq(arglist__34425);
          return G__34422__delegate.call(this, args)
        };
        return G__34422
      }()
    };
    var G__34421 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__34421__delegate.call(this, f1, f2, f3, fs)
    };
    G__34421.cljs$lang$maxFixedArity = 3;
    G__34421.cljs$lang$applyTo = function(arglist__34426) {
      var f1 = cljs.core.first(arglist__34426);
      var f2 = cljs.core.first(cljs.core.next(arglist__34426));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34426)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34426)));
      return G__34421__delegate.call(this, f1, f2, f3, fs)
    };
    return G__34421
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__34397.call(this);
      case 1:
        return comp__34398.call(this, f1);
      case 2:
        return comp__34399.call(this, f1, f2);
      case 3:
        return comp__34400.call(this, f1, f2, f3);
      default:
        return comp__34401.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__34401.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__34427 = function(f, arg1) {
    return function() {
      var G__34432__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__34432 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__34432__delegate.call(this, args)
      };
      G__34432.cljs$lang$maxFixedArity = 0;
      G__34432.cljs$lang$applyTo = function(arglist__34433) {
        var args = cljs.core.seq(arglist__34433);
        return G__34432__delegate.call(this, args)
      };
      return G__34432
    }()
  };
  var partial__34428 = function(f, arg1, arg2) {
    return function() {
      var G__34434__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__34434 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__34434__delegate.call(this, args)
      };
      G__34434.cljs$lang$maxFixedArity = 0;
      G__34434.cljs$lang$applyTo = function(arglist__34435) {
        var args = cljs.core.seq(arglist__34435);
        return G__34434__delegate.call(this, args)
      };
      return G__34434
    }()
  };
  var partial__34429 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__34436__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__34436 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__34436__delegate.call(this, args)
      };
      G__34436.cljs$lang$maxFixedArity = 0;
      G__34436.cljs$lang$applyTo = function(arglist__34437) {
        var args = cljs.core.seq(arglist__34437);
        return G__34436__delegate.call(this, args)
      };
      return G__34436
    }()
  };
  var partial__34430 = function() {
    var G__34438__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__34439__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__34439 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__34439__delegate.call(this, args)
        };
        G__34439.cljs$lang$maxFixedArity = 0;
        G__34439.cljs$lang$applyTo = function(arglist__34440) {
          var args = cljs.core.seq(arglist__34440);
          return G__34439__delegate.call(this, args)
        };
        return G__34439
      }()
    };
    var G__34438 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__34438__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__34438.cljs$lang$maxFixedArity = 4;
    G__34438.cljs$lang$applyTo = function(arglist__34441) {
      var f = cljs.core.first(arglist__34441);
      var arg1 = cljs.core.first(cljs.core.next(arglist__34441));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34441)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34441))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34441))));
      return G__34438__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__34438
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__34427.call(this, f, arg1);
      case 3:
        return partial__34428.call(this, f, arg1, arg2);
      case 4:
        return partial__34429.call(this, f, arg1, arg2, arg3);
      default:
        return partial__34430.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__34430.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__34442 = function(f, x) {
    return function() {
      var G__34446 = null;
      var G__34446__34447 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__34446__34448 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__34446__34449 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__34446__34450 = function() {
        var G__34452__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__34452 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34452__delegate.call(this, a, b, c, ds)
        };
        G__34452.cljs$lang$maxFixedArity = 3;
        G__34452.cljs$lang$applyTo = function(arglist__34453) {
          var a = cljs.core.first(arglist__34453);
          var b = cljs.core.first(cljs.core.next(arglist__34453));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34453)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34453)));
          return G__34452__delegate.call(this, a, b, c, ds)
        };
        return G__34452
      }();
      G__34446 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__34446__34447.call(this, a);
          case 2:
            return G__34446__34448.call(this, a, b);
          case 3:
            return G__34446__34449.call(this, a, b, c);
          default:
            return G__34446__34450.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__34446.cljs$lang$maxFixedArity = 3;
      G__34446.cljs$lang$applyTo = G__34446__34450.cljs$lang$applyTo;
      return G__34446
    }()
  };
  var fnil__34443 = function(f, x, y) {
    return function() {
      var G__34454 = null;
      var G__34454__34455 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__34454__34456 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__34454__34457 = function() {
        var G__34459__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__34459 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34459__delegate.call(this, a, b, c, ds)
        };
        G__34459.cljs$lang$maxFixedArity = 3;
        G__34459.cljs$lang$applyTo = function(arglist__34460) {
          var a = cljs.core.first(arglist__34460);
          var b = cljs.core.first(cljs.core.next(arglist__34460));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34460)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34460)));
          return G__34459__delegate.call(this, a, b, c, ds)
        };
        return G__34459
      }();
      G__34454 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__34454__34455.call(this, a, b);
          case 3:
            return G__34454__34456.call(this, a, b, c);
          default:
            return G__34454__34457.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__34454.cljs$lang$maxFixedArity = 3;
      G__34454.cljs$lang$applyTo = G__34454__34457.cljs$lang$applyTo;
      return G__34454
    }()
  };
  var fnil__34444 = function(f, x, y, z) {
    return function() {
      var G__34461 = null;
      var G__34461__34462 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__34461__34463 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__34461__34464 = function() {
        var G__34466__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__34466 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34466__delegate.call(this, a, b, c, ds)
        };
        G__34466.cljs$lang$maxFixedArity = 3;
        G__34466.cljs$lang$applyTo = function(arglist__34467) {
          var a = cljs.core.first(arglist__34467);
          var b = cljs.core.first(cljs.core.next(arglist__34467));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34467)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34467)));
          return G__34466__delegate.call(this, a, b, c, ds)
        };
        return G__34466
      }();
      G__34461 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__34461__34462.call(this, a, b);
          case 3:
            return G__34461__34463.call(this, a, b, c);
          default:
            return G__34461__34464.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__34461.cljs$lang$maxFixedArity = 3;
      G__34461.cljs$lang$applyTo = G__34461__34464.cljs$lang$applyTo;
      return G__34461
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__34442.call(this, f, x);
      case 3:
        return fnil__34443.call(this, f, x, y);
      case 4:
        return fnil__34444.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__34470 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____34468 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____34468)) {
        var s__34469 = temp__3698__auto____34468;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__34469)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__34469)))
      }else {
        return null
      }
    })
  };
  return mapi__34470.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____34471 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____34471)) {
      var s__34472 = temp__3698__auto____34471;
      var x__34473 = f.call(null, cljs.core.first.call(null, s__34472));
      if(cljs.core.truth_(x__34473 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__34472))
      }else {
        return cljs.core.cons.call(null, x__34473, keep.call(null, f, cljs.core.rest.call(null, s__34472)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__34483 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____34480 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____34480)) {
        var s__34481 = temp__3698__auto____34480;
        var x__34482 = f.call(null, idx, cljs.core.first.call(null, s__34481));
        if(cljs.core.truth_(x__34482 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__34481))
        }else {
          return cljs.core.cons.call(null, x__34482, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__34481)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__34483.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__34528 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__34533 = function() {
        return true
      };
      var ep1__34534 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__34535 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____34490 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____34490)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____34490
          }
        }())
      };
      var ep1__34536 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____34491 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____34491)) {
            var and__3546__auto____34492 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____34492)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____34492
            }
          }else {
            return and__3546__auto____34491
          }
        }())
      };
      var ep1__34537 = function() {
        var G__34539__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____34493 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____34493)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____34493
            }
          }())
        };
        var G__34539 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34539__delegate.call(this, x, y, z, args)
        };
        G__34539.cljs$lang$maxFixedArity = 3;
        G__34539.cljs$lang$applyTo = function(arglist__34540) {
          var x = cljs.core.first(arglist__34540);
          var y = cljs.core.first(cljs.core.next(arglist__34540));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34540)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34540)));
          return G__34539__delegate.call(this, x, y, z, args)
        };
        return G__34539
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__34533.call(this);
          case 1:
            return ep1__34534.call(this, x);
          case 2:
            return ep1__34535.call(this, x, y);
          case 3:
            return ep1__34536.call(this, x, y, z);
          default:
            return ep1__34537.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__34537.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__34529 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__34541 = function() {
        return true
      };
      var ep2__34542 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____34494 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____34494)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____34494
          }
        }())
      };
      var ep2__34543 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____34495 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____34495)) {
            var and__3546__auto____34496 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____34496)) {
              var and__3546__auto____34497 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____34497)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____34497
              }
            }else {
              return and__3546__auto____34496
            }
          }else {
            return and__3546__auto____34495
          }
        }())
      };
      var ep2__34544 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____34498 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____34498)) {
            var and__3546__auto____34499 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____34499)) {
              var and__3546__auto____34500 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____34500)) {
                var and__3546__auto____34501 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____34501)) {
                  var and__3546__auto____34502 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____34502)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____34502
                  }
                }else {
                  return and__3546__auto____34501
                }
              }else {
                return and__3546__auto____34500
              }
            }else {
              return and__3546__auto____34499
            }
          }else {
            return and__3546__auto____34498
          }
        }())
      };
      var ep2__34545 = function() {
        var G__34547__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____34503 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____34503)) {
              return cljs.core.every_QMARK_.call(null, function(p1__34474_SHARP_) {
                var and__3546__auto____34504 = p1.call(null, p1__34474_SHARP_);
                if(cljs.core.truth_(and__3546__auto____34504)) {
                  return p2.call(null, p1__34474_SHARP_)
                }else {
                  return and__3546__auto____34504
                }
              }, args)
            }else {
              return and__3546__auto____34503
            }
          }())
        };
        var G__34547 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34547__delegate.call(this, x, y, z, args)
        };
        G__34547.cljs$lang$maxFixedArity = 3;
        G__34547.cljs$lang$applyTo = function(arglist__34548) {
          var x = cljs.core.first(arglist__34548);
          var y = cljs.core.first(cljs.core.next(arglist__34548));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34548)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34548)));
          return G__34547__delegate.call(this, x, y, z, args)
        };
        return G__34547
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__34541.call(this);
          case 1:
            return ep2__34542.call(this, x);
          case 2:
            return ep2__34543.call(this, x, y);
          case 3:
            return ep2__34544.call(this, x, y, z);
          default:
            return ep2__34545.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__34545.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__34530 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__34549 = function() {
        return true
      };
      var ep3__34550 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____34505 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____34505)) {
            var and__3546__auto____34506 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____34506)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____34506
            }
          }else {
            return and__3546__auto____34505
          }
        }())
      };
      var ep3__34551 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____34507 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____34507)) {
            var and__3546__auto____34508 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____34508)) {
              var and__3546__auto____34509 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____34509)) {
                var and__3546__auto____34510 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____34510)) {
                  var and__3546__auto____34511 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____34511)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____34511
                  }
                }else {
                  return and__3546__auto____34510
                }
              }else {
                return and__3546__auto____34509
              }
            }else {
              return and__3546__auto____34508
            }
          }else {
            return and__3546__auto____34507
          }
        }())
      };
      var ep3__34552 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____34512 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____34512)) {
            var and__3546__auto____34513 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____34513)) {
              var and__3546__auto____34514 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____34514)) {
                var and__3546__auto____34515 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____34515)) {
                  var and__3546__auto____34516 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____34516)) {
                    var and__3546__auto____34517 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____34517)) {
                      var and__3546__auto____34518 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____34518)) {
                        var and__3546__auto____34519 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____34519)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____34519
                        }
                      }else {
                        return and__3546__auto____34518
                      }
                    }else {
                      return and__3546__auto____34517
                    }
                  }else {
                    return and__3546__auto____34516
                  }
                }else {
                  return and__3546__auto____34515
                }
              }else {
                return and__3546__auto____34514
              }
            }else {
              return and__3546__auto____34513
            }
          }else {
            return and__3546__auto____34512
          }
        }())
      };
      var ep3__34553 = function() {
        var G__34555__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____34520 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____34520)) {
              return cljs.core.every_QMARK_.call(null, function(p1__34475_SHARP_) {
                var and__3546__auto____34521 = p1.call(null, p1__34475_SHARP_);
                if(cljs.core.truth_(and__3546__auto____34521)) {
                  var and__3546__auto____34522 = p2.call(null, p1__34475_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____34522)) {
                    return p3.call(null, p1__34475_SHARP_)
                  }else {
                    return and__3546__auto____34522
                  }
                }else {
                  return and__3546__auto____34521
                }
              }, args)
            }else {
              return and__3546__auto____34520
            }
          }())
        };
        var G__34555 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34555__delegate.call(this, x, y, z, args)
        };
        G__34555.cljs$lang$maxFixedArity = 3;
        G__34555.cljs$lang$applyTo = function(arglist__34556) {
          var x = cljs.core.first(arglist__34556);
          var y = cljs.core.first(cljs.core.next(arglist__34556));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34556)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34556)));
          return G__34555__delegate.call(this, x, y, z, args)
        };
        return G__34555
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__34549.call(this);
          case 1:
            return ep3__34550.call(this, x);
          case 2:
            return ep3__34551.call(this, x, y);
          case 3:
            return ep3__34552.call(this, x, y, z);
          default:
            return ep3__34553.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__34553.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__34531 = function() {
    var G__34557__delegate = function(p1, p2, p3, ps) {
      var ps__34523 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__34558 = function() {
          return true
        };
        var epn__34559 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__34476_SHARP_) {
            return p1__34476_SHARP_.call(null, x)
          }, ps__34523)
        };
        var epn__34560 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__34477_SHARP_) {
            var and__3546__auto____34524 = p1__34477_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____34524)) {
              return p1__34477_SHARP_.call(null, y)
            }else {
              return and__3546__auto____34524
            }
          }, ps__34523)
        };
        var epn__34561 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__34478_SHARP_) {
            var and__3546__auto____34525 = p1__34478_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____34525)) {
              var and__3546__auto____34526 = p1__34478_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____34526)) {
                return p1__34478_SHARP_.call(null, z)
              }else {
                return and__3546__auto____34526
              }
            }else {
              return and__3546__auto____34525
            }
          }, ps__34523)
        };
        var epn__34562 = function() {
          var G__34564__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____34527 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____34527)) {
                return cljs.core.every_QMARK_.call(null, function(p1__34479_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__34479_SHARP_, args)
                }, ps__34523)
              }else {
                return and__3546__auto____34527
              }
            }())
          };
          var G__34564 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__34564__delegate.call(this, x, y, z, args)
          };
          G__34564.cljs$lang$maxFixedArity = 3;
          G__34564.cljs$lang$applyTo = function(arglist__34565) {
            var x = cljs.core.first(arglist__34565);
            var y = cljs.core.first(cljs.core.next(arglist__34565));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34565)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34565)));
            return G__34564__delegate.call(this, x, y, z, args)
          };
          return G__34564
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__34558.call(this);
            case 1:
              return epn__34559.call(this, x);
            case 2:
              return epn__34560.call(this, x, y);
            case 3:
              return epn__34561.call(this, x, y, z);
            default:
              return epn__34562.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__34562.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__34557 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__34557__delegate.call(this, p1, p2, p3, ps)
    };
    G__34557.cljs$lang$maxFixedArity = 3;
    G__34557.cljs$lang$applyTo = function(arglist__34566) {
      var p1 = cljs.core.first(arglist__34566);
      var p2 = cljs.core.first(cljs.core.next(arglist__34566));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34566)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34566)));
      return G__34557__delegate.call(this, p1, p2, p3, ps)
    };
    return G__34557
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__34528.call(this, p1);
      case 2:
        return every_pred__34529.call(this, p1, p2);
      case 3:
        return every_pred__34530.call(this, p1, p2, p3);
      default:
        return every_pred__34531.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__34531.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__34606 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__34611 = function() {
        return null
      };
      var sp1__34612 = function(x) {
        return p.call(null, x)
      };
      var sp1__34613 = function(x, y) {
        var or__3548__auto____34568 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____34568)) {
          return or__3548__auto____34568
        }else {
          return p.call(null, y)
        }
      };
      var sp1__34614 = function(x, y, z) {
        var or__3548__auto____34569 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____34569)) {
          return or__3548__auto____34569
        }else {
          var or__3548__auto____34570 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____34570)) {
            return or__3548__auto____34570
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__34615 = function() {
        var G__34617__delegate = function(x, y, z, args) {
          var or__3548__auto____34571 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____34571)) {
            return or__3548__auto____34571
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__34617 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34617__delegate.call(this, x, y, z, args)
        };
        G__34617.cljs$lang$maxFixedArity = 3;
        G__34617.cljs$lang$applyTo = function(arglist__34618) {
          var x = cljs.core.first(arglist__34618);
          var y = cljs.core.first(cljs.core.next(arglist__34618));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34618)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34618)));
          return G__34617__delegate.call(this, x, y, z, args)
        };
        return G__34617
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__34611.call(this);
          case 1:
            return sp1__34612.call(this, x);
          case 2:
            return sp1__34613.call(this, x, y);
          case 3:
            return sp1__34614.call(this, x, y, z);
          default:
            return sp1__34615.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__34615.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__34607 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__34619 = function() {
        return null
      };
      var sp2__34620 = function(x) {
        var or__3548__auto____34572 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____34572)) {
          return or__3548__auto____34572
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__34621 = function(x, y) {
        var or__3548__auto____34573 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____34573)) {
          return or__3548__auto____34573
        }else {
          var or__3548__auto____34574 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____34574)) {
            return or__3548__auto____34574
          }else {
            var or__3548__auto____34575 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____34575)) {
              return or__3548__auto____34575
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__34622 = function(x, y, z) {
        var or__3548__auto____34576 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____34576)) {
          return or__3548__auto____34576
        }else {
          var or__3548__auto____34577 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____34577)) {
            return or__3548__auto____34577
          }else {
            var or__3548__auto____34578 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____34578)) {
              return or__3548__auto____34578
            }else {
              var or__3548__auto____34579 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____34579)) {
                return or__3548__auto____34579
              }else {
                var or__3548__auto____34580 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____34580)) {
                  return or__3548__auto____34580
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__34623 = function() {
        var G__34625__delegate = function(x, y, z, args) {
          var or__3548__auto____34581 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____34581)) {
            return or__3548__auto____34581
          }else {
            return cljs.core.some.call(null, function(p1__34484_SHARP_) {
              var or__3548__auto____34582 = p1.call(null, p1__34484_SHARP_);
              if(cljs.core.truth_(or__3548__auto____34582)) {
                return or__3548__auto____34582
              }else {
                return p2.call(null, p1__34484_SHARP_)
              }
            }, args)
          }
        };
        var G__34625 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34625__delegate.call(this, x, y, z, args)
        };
        G__34625.cljs$lang$maxFixedArity = 3;
        G__34625.cljs$lang$applyTo = function(arglist__34626) {
          var x = cljs.core.first(arglist__34626);
          var y = cljs.core.first(cljs.core.next(arglist__34626));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34626)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34626)));
          return G__34625__delegate.call(this, x, y, z, args)
        };
        return G__34625
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__34619.call(this);
          case 1:
            return sp2__34620.call(this, x);
          case 2:
            return sp2__34621.call(this, x, y);
          case 3:
            return sp2__34622.call(this, x, y, z);
          default:
            return sp2__34623.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__34623.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__34608 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__34627 = function() {
        return null
      };
      var sp3__34628 = function(x) {
        var or__3548__auto____34583 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____34583)) {
          return or__3548__auto____34583
        }else {
          var or__3548__auto____34584 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____34584)) {
            return or__3548__auto____34584
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__34629 = function(x, y) {
        var or__3548__auto____34585 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____34585)) {
          return or__3548__auto____34585
        }else {
          var or__3548__auto____34586 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____34586)) {
            return or__3548__auto____34586
          }else {
            var or__3548__auto____34587 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____34587)) {
              return or__3548__auto____34587
            }else {
              var or__3548__auto____34588 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____34588)) {
                return or__3548__auto____34588
              }else {
                var or__3548__auto____34589 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____34589)) {
                  return or__3548__auto____34589
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__34630 = function(x, y, z) {
        var or__3548__auto____34590 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____34590)) {
          return or__3548__auto____34590
        }else {
          var or__3548__auto____34591 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____34591)) {
            return or__3548__auto____34591
          }else {
            var or__3548__auto____34592 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____34592)) {
              return or__3548__auto____34592
            }else {
              var or__3548__auto____34593 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____34593)) {
                return or__3548__auto____34593
              }else {
                var or__3548__auto____34594 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____34594)) {
                  return or__3548__auto____34594
                }else {
                  var or__3548__auto____34595 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____34595)) {
                    return or__3548__auto____34595
                  }else {
                    var or__3548__auto____34596 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____34596)) {
                      return or__3548__auto____34596
                    }else {
                      var or__3548__auto____34597 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____34597)) {
                        return or__3548__auto____34597
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
      var sp3__34631 = function() {
        var G__34633__delegate = function(x, y, z, args) {
          var or__3548__auto____34598 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____34598)) {
            return or__3548__auto____34598
          }else {
            return cljs.core.some.call(null, function(p1__34485_SHARP_) {
              var or__3548__auto____34599 = p1.call(null, p1__34485_SHARP_);
              if(cljs.core.truth_(or__3548__auto____34599)) {
                return or__3548__auto____34599
              }else {
                var or__3548__auto____34600 = p2.call(null, p1__34485_SHARP_);
                if(cljs.core.truth_(or__3548__auto____34600)) {
                  return or__3548__auto____34600
                }else {
                  return p3.call(null, p1__34485_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__34633 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__34633__delegate.call(this, x, y, z, args)
        };
        G__34633.cljs$lang$maxFixedArity = 3;
        G__34633.cljs$lang$applyTo = function(arglist__34634) {
          var x = cljs.core.first(arglist__34634);
          var y = cljs.core.first(cljs.core.next(arglist__34634));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34634)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34634)));
          return G__34633__delegate.call(this, x, y, z, args)
        };
        return G__34633
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__34627.call(this);
          case 1:
            return sp3__34628.call(this, x);
          case 2:
            return sp3__34629.call(this, x, y);
          case 3:
            return sp3__34630.call(this, x, y, z);
          default:
            return sp3__34631.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__34631.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__34609 = function() {
    var G__34635__delegate = function(p1, p2, p3, ps) {
      var ps__34601 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__34636 = function() {
          return null
        };
        var spn__34637 = function(x) {
          return cljs.core.some.call(null, function(p1__34486_SHARP_) {
            return p1__34486_SHARP_.call(null, x)
          }, ps__34601)
        };
        var spn__34638 = function(x, y) {
          return cljs.core.some.call(null, function(p1__34487_SHARP_) {
            var or__3548__auto____34602 = p1__34487_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____34602)) {
              return or__3548__auto____34602
            }else {
              return p1__34487_SHARP_.call(null, y)
            }
          }, ps__34601)
        };
        var spn__34639 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__34488_SHARP_) {
            var or__3548__auto____34603 = p1__34488_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____34603)) {
              return or__3548__auto____34603
            }else {
              var or__3548__auto____34604 = p1__34488_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____34604)) {
                return or__3548__auto____34604
              }else {
                return p1__34488_SHARP_.call(null, z)
              }
            }
          }, ps__34601)
        };
        var spn__34640 = function() {
          var G__34642__delegate = function(x, y, z, args) {
            var or__3548__auto____34605 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____34605)) {
              return or__3548__auto____34605
            }else {
              return cljs.core.some.call(null, function(p1__34489_SHARP_) {
                return cljs.core.some.call(null, p1__34489_SHARP_, args)
              }, ps__34601)
            }
          };
          var G__34642 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__34642__delegate.call(this, x, y, z, args)
          };
          G__34642.cljs$lang$maxFixedArity = 3;
          G__34642.cljs$lang$applyTo = function(arglist__34643) {
            var x = cljs.core.first(arglist__34643);
            var y = cljs.core.first(cljs.core.next(arglist__34643));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34643)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34643)));
            return G__34642__delegate.call(this, x, y, z, args)
          };
          return G__34642
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__34636.call(this);
            case 1:
              return spn__34637.call(this, x);
            case 2:
              return spn__34638.call(this, x, y);
            case 3:
              return spn__34639.call(this, x, y, z);
            default:
              return spn__34640.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__34640.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__34635 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__34635__delegate.call(this, p1, p2, p3, ps)
    };
    G__34635.cljs$lang$maxFixedArity = 3;
    G__34635.cljs$lang$applyTo = function(arglist__34644) {
      var p1 = cljs.core.first(arglist__34644);
      var p2 = cljs.core.first(cljs.core.next(arglist__34644));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34644)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34644)));
      return G__34635__delegate.call(this, p1, p2, p3, ps)
    };
    return G__34635
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__34606.call(this, p1);
      case 2:
        return some_fn__34607.call(this, p1, p2);
      case 3:
        return some_fn__34608.call(this, p1, p2, p3);
      default:
        return some_fn__34609.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__34609.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__34657 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____34645 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____34645)) {
        var s__34646 = temp__3698__auto____34645;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__34646)), map.call(null, f, cljs.core.rest.call(null, s__34646)))
      }else {
        return null
      }
    })
  };
  var map__34658 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__34647 = cljs.core.seq.call(null, c1);
      var s2__34648 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____34649 = s1__34647;
        if(cljs.core.truth_(and__3546__auto____34649)) {
          return s2__34648
        }else {
          return and__3546__auto____34649
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__34647), cljs.core.first.call(null, s2__34648)), map.call(null, f, cljs.core.rest.call(null, s1__34647), cljs.core.rest.call(null, s2__34648)))
      }else {
        return null
      }
    })
  };
  var map__34659 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__34650 = cljs.core.seq.call(null, c1);
      var s2__34651 = cljs.core.seq.call(null, c2);
      var s3__34652 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____34653 = s1__34650;
        if(cljs.core.truth_(and__3546__auto____34653)) {
          var and__3546__auto____34654 = s2__34651;
          if(cljs.core.truth_(and__3546__auto____34654)) {
            return s3__34652
          }else {
            return and__3546__auto____34654
          }
        }else {
          return and__3546__auto____34653
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__34650), cljs.core.first.call(null, s2__34651), cljs.core.first.call(null, s3__34652)), map.call(null, f, cljs.core.rest.call(null, s1__34650), cljs.core.rest.call(null, s2__34651), cljs.core.rest.call(null, s3__34652)))
      }else {
        return null
      }
    })
  };
  var map__34660 = function() {
    var G__34662__delegate = function(f, c1, c2, c3, colls) {
      var step__34656 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__34655 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__34655))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__34655), step.call(null, map.call(null, cljs.core.rest, ss__34655)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__34567_SHARP_) {
        return cljs.core.apply.call(null, f, p1__34567_SHARP_)
      }, step__34656.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__34662 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__34662__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__34662.cljs$lang$maxFixedArity = 4;
    G__34662.cljs$lang$applyTo = function(arglist__34663) {
      var f = cljs.core.first(arglist__34663);
      var c1 = cljs.core.first(cljs.core.next(arglist__34663));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34663)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34663))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__34663))));
      return G__34662__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__34662
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__34657.call(this, f, c1);
      case 3:
        return map__34658.call(this, f, c1, c2);
      case 4:
        return map__34659.call(this, f, c1, c2, c3);
      default:
        return map__34660.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__34660.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____34664 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____34664)) {
        var s__34665 = temp__3698__auto____34664;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__34665), take.call(null, n - 1, cljs.core.rest.call(null, s__34665)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__34668 = function(n, coll) {
    while(true) {
      var s__34666 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____34667 = n > 0;
        if(cljs.core.truth_(and__3546__auto____34667)) {
          return s__34666
        }else {
          return and__3546__auto____34667
        }
      }())) {
        var G__34669 = n - 1;
        var G__34670 = cljs.core.rest.call(null, s__34666);
        n = G__34669;
        coll = G__34670;
        continue
      }else {
        return s__34666
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__34668.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__34671 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__34672 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__34671.call(this, n);
      case 2:
        return drop_last__34672.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__34674 = cljs.core.seq.call(null, coll);
  var lead__34675 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__34675)) {
      var G__34676 = cljs.core.next.call(null, s__34674);
      var G__34677 = cljs.core.next.call(null, lead__34675);
      s__34674 = G__34676;
      lead__34675 = G__34677;
      continue
    }else {
      return s__34674
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__34680 = function(pred, coll) {
    while(true) {
      var s__34678 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____34679 = s__34678;
        if(cljs.core.truth_(and__3546__auto____34679)) {
          return pred.call(null, cljs.core.first.call(null, s__34678))
        }else {
          return and__3546__auto____34679
        }
      }())) {
        var G__34681 = pred;
        var G__34682 = cljs.core.rest.call(null, s__34678);
        pred = G__34681;
        coll = G__34682;
        continue
      }else {
        return s__34678
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__34680.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____34683 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____34683)) {
      var s__34684 = temp__3698__auto____34683;
      return cljs.core.concat.call(null, s__34684, cycle.call(null, s__34684))
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
  var repeat__34685 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__34686 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__34685.call(this, n);
      case 2:
        return repeat__34686.call(this, n, x)
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
  var repeatedly__34688 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__34689 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__34688.call(this, n);
      case 2:
        return repeatedly__34689.call(this, n, f)
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
  var interleave__34695 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__34691 = cljs.core.seq.call(null, c1);
      var s2__34692 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____34693 = s1__34691;
        if(cljs.core.truth_(and__3546__auto____34693)) {
          return s2__34692
        }else {
          return and__3546__auto____34693
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__34691), cljs.core.cons.call(null, cljs.core.first.call(null, s2__34692), interleave.call(null, cljs.core.rest.call(null, s1__34691), cljs.core.rest.call(null, s2__34692))))
      }else {
        return null
      }
    })
  };
  var interleave__34696 = function() {
    var G__34698__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__34694 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__34694))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__34694), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__34694)))
        }else {
          return null
        }
      })
    };
    var G__34698 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34698__delegate.call(this, c1, c2, colls)
    };
    G__34698.cljs$lang$maxFixedArity = 2;
    G__34698.cljs$lang$applyTo = function(arglist__34699) {
      var c1 = cljs.core.first(arglist__34699);
      var c2 = cljs.core.first(cljs.core.next(arglist__34699));
      var colls = cljs.core.rest(cljs.core.next(arglist__34699));
      return G__34698__delegate.call(this, c1, c2, colls)
    };
    return G__34698
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__34695.call(this, c1, c2);
      default:
        return interleave__34696.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__34696.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__34702 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____34700 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____34700)) {
        var coll__34701 = temp__3695__auto____34700;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__34701), cat.call(null, cljs.core.rest.call(null, coll__34701), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__34702.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__34703 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__34704 = function() {
    var G__34706__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__34706 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__34706__delegate.call(this, f, coll, colls)
    };
    G__34706.cljs$lang$maxFixedArity = 2;
    G__34706.cljs$lang$applyTo = function(arglist__34707) {
      var f = cljs.core.first(arglist__34707);
      var coll = cljs.core.first(cljs.core.next(arglist__34707));
      var colls = cljs.core.rest(cljs.core.next(arglist__34707));
      return G__34706__delegate.call(this, f, coll, colls)
    };
    return G__34706
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__34703.call(this, f, coll);
      default:
        return mapcat__34704.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__34704.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____34708 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____34708)) {
      var s__34709 = temp__3698__auto____34708;
      var f__34710 = cljs.core.first.call(null, s__34709);
      var r__34711 = cljs.core.rest.call(null, s__34709);
      if(cljs.core.truth_(pred.call(null, f__34710))) {
        return cljs.core.cons.call(null, f__34710, filter.call(null, pred, r__34711))
      }else {
        return filter.call(null, pred, r__34711)
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
  var walk__34713 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__34713.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__34712_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__34712_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__34720 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__34721 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____34714 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____34714)) {
        var s__34715 = temp__3698__auto____34714;
        var p__34716 = cljs.core.take.call(null, n, s__34715);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__34716)))) {
          return cljs.core.cons.call(null, p__34716, partition.call(null, n, step, cljs.core.drop.call(null, step, s__34715)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__34722 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____34717 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____34717)) {
        var s__34718 = temp__3698__auto____34717;
        var p__34719 = cljs.core.take.call(null, n, s__34718);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__34719)))) {
          return cljs.core.cons.call(null, p__34719, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__34718)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__34719, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__34720.call(this, n, step);
      case 3:
        return partition__34721.call(this, n, step, pad);
      case 4:
        return partition__34722.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__34728 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__34729 = function(m, ks, not_found) {
    var sentinel__34724 = cljs.core.lookup_sentinel;
    var m__34725 = m;
    var ks__34726 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__34726)) {
        var m__34727 = cljs.core.get.call(null, m__34725, cljs.core.first.call(null, ks__34726), sentinel__34724);
        if(cljs.core.truth_(sentinel__34724 === m__34727)) {
          return not_found
        }else {
          var G__34731 = sentinel__34724;
          var G__34732 = m__34727;
          var G__34733 = cljs.core.next.call(null, ks__34726);
          sentinel__34724 = G__34731;
          m__34725 = G__34732;
          ks__34726 = G__34733;
          continue
        }
      }else {
        return m__34725
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__34728.call(this, m, ks);
      case 3:
        return get_in__34729.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__34734, v) {
  var vec__34735__34736 = p__34734;
  var k__34737 = cljs.core.nth.call(null, vec__34735__34736, 0, null);
  var ks__34738 = cljs.core.nthnext.call(null, vec__34735__34736, 1);
  if(cljs.core.truth_(ks__34738)) {
    return cljs.core.assoc.call(null, m, k__34737, assoc_in.call(null, cljs.core.get.call(null, m, k__34737), ks__34738, v))
  }else {
    return cljs.core.assoc.call(null, m, k__34737, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__34739, f, args) {
    var vec__34740__34741 = p__34739;
    var k__34742 = cljs.core.nth.call(null, vec__34740__34741, 0, null);
    var ks__34743 = cljs.core.nthnext.call(null, vec__34740__34741, 1);
    if(cljs.core.truth_(ks__34743)) {
      return cljs.core.assoc.call(null, m, k__34742, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__34742), ks__34743, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__34742, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__34742), args))
    }
  };
  var update_in = function(m, p__34739, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__34739, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__34744) {
    var m = cljs.core.first(arglist__34744);
    var p__34739 = cljs.core.first(cljs.core.next(arglist__34744));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__34744)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__34744)));
    return update_in__delegate.call(this, m, p__34739, f, args)
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
  var this__34745 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__34778 = null;
  var G__34778__34779 = function(coll, k) {
    var this__34746 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__34778__34780 = function(coll, k, not_found) {
    var this__34747 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__34778 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34778__34779.call(this, coll, k);
      case 3:
        return G__34778__34780.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34778
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__34748 = this;
  var new_array__34749 = cljs.core.aclone.call(null, this__34748.array);
  new_array__34749[k] = v;
  return new cljs.core.Vector(this__34748.meta, new_array__34749)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__34782 = null;
  var G__34782__34783 = function(tsym34750, k) {
    var this__34752 = this;
    var tsym34750__34753 = this;
    var coll__34754 = tsym34750__34753;
    return cljs.core._lookup.call(null, coll__34754, k)
  };
  var G__34782__34784 = function(tsym34751, k, not_found) {
    var this__34755 = this;
    var tsym34751__34756 = this;
    var coll__34757 = tsym34751__34756;
    return cljs.core._lookup.call(null, coll__34757, k, not_found)
  };
  G__34782 = function(tsym34751, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34782__34783.call(this, tsym34751, k);
      case 3:
        return G__34782__34784.call(this, tsym34751, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34782
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__34758 = this;
  var new_array__34759 = cljs.core.aclone.call(null, this__34758.array);
  new_array__34759.push(o);
  return new cljs.core.Vector(this__34758.meta, new_array__34759)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__34786 = null;
  var G__34786__34787 = function(v, f) {
    var this__34760 = this;
    return cljs.core.ci_reduce.call(null, this__34760.array, f)
  };
  var G__34786__34788 = function(v, f, start) {
    var this__34761 = this;
    return cljs.core.ci_reduce.call(null, this__34761.array, f, start)
  };
  G__34786 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__34786__34787.call(this, v, f);
      case 3:
        return G__34786__34788.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34786
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__34762 = this;
  if(cljs.core.truth_(this__34762.array.length > 0)) {
    var vector_seq__34763 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__34762.array.length)) {
          return cljs.core.cons.call(null, this__34762.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__34763.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__34764 = this;
  return this__34764.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__34765 = this;
  var count__34766 = this__34765.array.length;
  if(cljs.core.truth_(count__34766 > 0)) {
    return this__34765.array[count__34766 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__34767 = this;
  if(cljs.core.truth_(this__34767.array.length > 0)) {
    var new_array__34768 = cljs.core.aclone.call(null, this__34767.array);
    new_array__34768.pop();
    return new cljs.core.Vector(this__34767.meta, new_array__34768)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__34769 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34770 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34771 = this;
  return new cljs.core.Vector(meta, this__34771.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34772 = this;
  return this__34772.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__34790 = null;
  var G__34790__34791 = function(coll, n) {
    var this__34773 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____34774 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____34774)) {
        return n < this__34773.array.length
      }else {
        return and__3546__auto____34774
      }
    }())) {
      return this__34773.array[n]
    }else {
      return null
    }
  };
  var G__34790__34792 = function(coll, n, not_found) {
    var this__34775 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____34776 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____34776)) {
        return n < this__34775.array.length
      }else {
        return and__3546__auto____34776
      }
    }())) {
      return this__34775.array[n]
    }else {
      return not_found
    }
  };
  G__34790 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34790__34791.call(this, coll, n);
      case 3:
        return G__34790__34792.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34790
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34777 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__34777.meta)
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
  vector.cljs$lang$applyTo = function(arglist__34794) {
    var args = cljs.core.seq(arglist__34794);
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
  var this__34795 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__34823 = null;
  var G__34823__34824 = function(coll, k) {
    var this__34796 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__34823__34825 = function(coll, k, not_found) {
    var this__34797 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__34823 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34823__34824.call(this, coll, k);
      case 3:
        return G__34823__34825.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34823
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__34798 = this;
  var v_pos__34799 = this__34798.start + key;
  return new cljs.core.Subvec(this__34798.meta, cljs.core._assoc.call(null, this__34798.v, v_pos__34799, val), this__34798.start, this__34798.end > v_pos__34799 + 1 ? this__34798.end : v_pos__34799 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__34827 = null;
  var G__34827__34828 = function(tsym34800, k) {
    var this__34802 = this;
    var tsym34800__34803 = this;
    var coll__34804 = tsym34800__34803;
    return cljs.core._lookup.call(null, coll__34804, k)
  };
  var G__34827__34829 = function(tsym34801, k, not_found) {
    var this__34805 = this;
    var tsym34801__34806 = this;
    var coll__34807 = tsym34801__34806;
    return cljs.core._lookup.call(null, coll__34807, k, not_found)
  };
  G__34827 = function(tsym34801, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34827__34828.call(this, tsym34801, k);
      case 3:
        return G__34827__34829.call(this, tsym34801, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34827
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__34808 = this;
  return new cljs.core.Subvec(this__34808.meta, cljs.core._assoc_n.call(null, this__34808.v, this__34808.end, o), this__34808.start, this__34808.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__34831 = null;
  var G__34831__34832 = function(coll, f) {
    var this__34809 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__34831__34833 = function(coll, f, start) {
    var this__34810 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__34831 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__34831__34832.call(this, coll, f);
      case 3:
        return G__34831__34833.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34831
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__34811 = this;
  var subvec_seq__34812 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__34811.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__34811.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__34812.call(null, this__34811.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__34813 = this;
  return this__34813.end - this__34813.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__34814 = this;
  return cljs.core._nth.call(null, this__34814.v, this__34814.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__34815 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__34815.start, this__34815.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__34815.meta, this__34815.v, this__34815.start, this__34815.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__34816 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34817 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34818 = this;
  return new cljs.core.Subvec(meta, this__34818.v, this__34818.start, this__34818.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34819 = this;
  return this__34819.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__34835 = null;
  var G__34835__34836 = function(coll, n) {
    var this__34820 = this;
    return cljs.core._nth.call(null, this__34820.v, this__34820.start + n)
  };
  var G__34835__34837 = function(coll, n, not_found) {
    var this__34821 = this;
    return cljs.core._nth.call(null, this__34821.v, this__34821.start + n, not_found)
  };
  G__34835 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34835__34836.call(this, coll, n);
      case 3:
        return G__34835__34837.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34835
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34822 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__34822.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__34839 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__34840 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__34839.call(this, v, start);
      case 3:
        return subvec__34840.call(this, v, start, end)
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
  var this__34842 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__34843 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34844 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34845 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__34845.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__34846 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__34847 = this;
  return cljs.core._first.call(null, this__34847.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__34848 = this;
  var temp__3695__auto____34849 = cljs.core.next.call(null, this__34848.front);
  if(cljs.core.truth_(temp__3695__auto____34849)) {
    var f1__34850 = temp__3695__auto____34849;
    return new cljs.core.PersistentQueueSeq(this__34848.meta, f1__34850, this__34848.rear)
  }else {
    if(cljs.core.truth_(this__34848.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__34848.meta, this__34848.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34851 = this;
  return this__34851.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34852 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__34852.front, this__34852.rear)
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
  var this__34853 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__34854 = this;
  if(cljs.core.truth_(this__34854.front)) {
    return new cljs.core.PersistentQueue(this__34854.meta, this__34854.count + 1, this__34854.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____34855 = this__34854.rear;
      if(cljs.core.truth_(or__3548__auto____34855)) {
        return or__3548__auto____34855
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__34854.meta, this__34854.count + 1, cljs.core.conj.call(null, this__34854.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__34856 = this;
  var rear__34857 = cljs.core.seq.call(null, this__34856.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____34858 = this__34856.front;
    if(cljs.core.truth_(or__3548__auto____34858)) {
      return or__3548__auto____34858
    }else {
      return rear__34857
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__34856.front, cljs.core.seq.call(null, rear__34857))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__34859 = this;
  return this__34859.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__34860 = this;
  return cljs.core._first.call(null, this__34860.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__34861 = this;
  if(cljs.core.truth_(this__34861.front)) {
    var temp__3695__auto____34862 = cljs.core.next.call(null, this__34861.front);
    if(cljs.core.truth_(temp__3695__auto____34862)) {
      var f1__34863 = temp__3695__auto____34862;
      return new cljs.core.PersistentQueue(this__34861.meta, this__34861.count - 1, f1__34863, this__34861.rear)
    }else {
      return new cljs.core.PersistentQueue(this__34861.meta, this__34861.count - 1, cljs.core.seq.call(null, this__34861.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__34864 = this;
  return cljs.core.first.call(null, this__34864.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__34865 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34866 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34867 = this;
  return new cljs.core.PersistentQueue(meta, this__34867.count, this__34867.front, this__34867.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34868 = this;
  return this__34868.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34869 = this;
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
  var this__34870 = this;
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
  var len__34871 = array.length;
  var i__34872 = 0;
  while(true) {
    if(cljs.core.truth_(i__34872 < len__34871)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__34872]))) {
        return i__34872
      }else {
        var G__34873 = i__34872 + incr;
        i__34872 = G__34873;
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
  var obj_map_contains_key_QMARK___34875 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___34876 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____34874 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____34874)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____34874
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
        return obj_map_contains_key_QMARK___34875.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___34876.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__34879 = cljs.core.hash.call(null, a);
  var b__34880 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__34879 < b__34880)) {
    return-1
  }else {
    if(cljs.core.truth_(a__34879 > b__34880)) {
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
  var this__34881 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__34908 = null;
  var G__34908__34909 = function(coll, k) {
    var this__34882 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__34908__34910 = function(coll, k, not_found) {
    var this__34883 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__34883.strobj, this__34883.strobj[k], not_found)
  };
  G__34908 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34908__34909.call(this, coll, k);
      case 3:
        return G__34908__34910.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34908
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__34884 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__34885 = goog.object.clone.call(null, this__34884.strobj);
    var overwrite_QMARK___34886 = new_strobj__34885.hasOwnProperty(k);
    new_strobj__34885[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___34886)) {
      return new cljs.core.ObjMap(this__34884.meta, this__34884.keys, new_strobj__34885)
    }else {
      var new_keys__34887 = cljs.core.aclone.call(null, this__34884.keys);
      new_keys__34887.push(k);
      return new cljs.core.ObjMap(this__34884.meta, new_keys__34887, new_strobj__34885)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__34884.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__34888 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__34888.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__34912 = null;
  var G__34912__34913 = function(tsym34889, k) {
    var this__34891 = this;
    var tsym34889__34892 = this;
    var coll__34893 = tsym34889__34892;
    return cljs.core._lookup.call(null, coll__34893, k)
  };
  var G__34912__34914 = function(tsym34890, k, not_found) {
    var this__34894 = this;
    var tsym34890__34895 = this;
    var coll__34896 = tsym34890__34895;
    return cljs.core._lookup.call(null, coll__34896, k, not_found)
  };
  G__34912 = function(tsym34890, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34912__34913.call(this, tsym34890, k);
      case 3:
        return G__34912__34914.call(this, tsym34890, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34912
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__34897 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__34898 = this;
  if(cljs.core.truth_(this__34898.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__34878_SHARP_) {
      return cljs.core.vector.call(null, p1__34878_SHARP_, this__34898.strobj[p1__34878_SHARP_])
    }, this__34898.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__34899 = this;
  return this__34899.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34900 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34901 = this;
  return new cljs.core.ObjMap(meta, this__34901.keys, this__34901.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34902 = this;
  return this__34902.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34903 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__34903.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__34904 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____34905 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____34905)) {
      return this__34904.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____34905
    }
  }())) {
    var new_keys__34906 = cljs.core.aclone.call(null, this__34904.keys);
    var new_strobj__34907 = goog.object.clone.call(null, this__34904.strobj);
    new_keys__34906.splice(cljs.core.scan_array.call(null, 1, k, new_keys__34906), 1);
    cljs.core.js_delete.call(null, new_strobj__34907, k);
    return new cljs.core.ObjMap(this__34904.meta, new_keys__34906, new_strobj__34907)
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
  var this__34917 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__34955 = null;
  var G__34955__34956 = function(coll, k) {
    var this__34918 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__34955__34957 = function(coll, k, not_found) {
    var this__34919 = this;
    var bucket__34920 = this__34919.hashobj[cljs.core.hash.call(null, k)];
    var i__34921 = cljs.core.truth_(bucket__34920) ? cljs.core.scan_array.call(null, 2, k, bucket__34920) : null;
    if(cljs.core.truth_(i__34921)) {
      return bucket__34920[i__34921 + 1]
    }else {
      return not_found
    }
  };
  G__34955 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34955__34956.call(this, coll, k);
      case 3:
        return G__34955__34957.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34955
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__34922 = this;
  var h__34923 = cljs.core.hash.call(null, k);
  var bucket__34924 = this__34922.hashobj[h__34923];
  if(cljs.core.truth_(bucket__34924)) {
    var new_bucket__34925 = cljs.core.aclone.call(null, bucket__34924);
    var new_hashobj__34926 = goog.object.clone.call(null, this__34922.hashobj);
    new_hashobj__34926[h__34923] = new_bucket__34925;
    var temp__3695__auto____34927 = cljs.core.scan_array.call(null, 2, k, new_bucket__34925);
    if(cljs.core.truth_(temp__3695__auto____34927)) {
      var i__34928 = temp__3695__auto____34927;
      new_bucket__34925[i__34928 + 1] = v;
      return new cljs.core.HashMap(this__34922.meta, this__34922.count, new_hashobj__34926)
    }else {
      new_bucket__34925.push(k, v);
      return new cljs.core.HashMap(this__34922.meta, this__34922.count + 1, new_hashobj__34926)
    }
  }else {
    var new_hashobj__34929 = goog.object.clone.call(null, this__34922.hashobj);
    new_hashobj__34929[h__34923] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__34922.meta, this__34922.count + 1, new_hashobj__34929)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__34930 = this;
  var bucket__34931 = this__34930.hashobj[cljs.core.hash.call(null, k)];
  var i__34932 = cljs.core.truth_(bucket__34931) ? cljs.core.scan_array.call(null, 2, k, bucket__34931) : null;
  if(cljs.core.truth_(i__34932)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__34959 = null;
  var G__34959__34960 = function(tsym34933, k) {
    var this__34935 = this;
    var tsym34933__34936 = this;
    var coll__34937 = tsym34933__34936;
    return cljs.core._lookup.call(null, coll__34937, k)
  };
  var G__34959__34961 = function(tsym34934, k, not_found) {
    var this__34938 = this;
    var tsym34934__34939 = this;
    var coll__34940 = tsym34934__34939;
    return cljs.core._lookup.call(null, coll__34940, k, not_found)
  };
  G__34959 = function(tsym34934, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__34959__34960.call(this, tsym34934, k);
      case 3:
        return G__34959__34961.call(this, tsym34934, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__34959
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__34941 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__34942 = this;
  if(cljs.core.truth_(this__34942.count > 0)) {
    var hashes__34943 = cljs.core.js_keys.call(null, this__34942.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__34916_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__34942.hashobj[p1__34916_SHARP_]))
    }, hashes__34943)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__34944 = this;
  return this__34944.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__34945 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__34946 = this;
  return new cljs.core.HashMap(meta, this__34946.count, this__34946.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__34947 = this;
  return this__34947.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__34948 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__34948.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__34949 = this;
  var h__34950 = cljs.core.hash.call(null, k);
  var bucket__34951 = this__34949.hashobj[h__34950];
  var i__34952 = cljs.core.truth_(bucket__34951) ? cljs.core.scan_array.call(null, 2, k, bucket__34951) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__34952))) {
    return coll
  }else {
    var new_hashobj__34953 = goog.object.clone.call(null, this__34949.hashobj);
    if(cljs.core.truth_(3 > bucket__34951.length)) {
      cljs.core.js_delete.call(null, new_hashobj__34953, h__34950)
    }else {
      var new_bucket__34954 = cljs.core.aclone.call(null, bucket__34951);
      new_bucket__34954.splice(i__34952, 2);
      new_hashobj__34953[h__34950] = new_bucket__34954
    }
    return new cljs.core.HashMap(this__34949.meta, this__34949.count - 1, new_hashobj__34953)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__34963 = ks.length;
  var i__34964 = 0;
  var out__34965 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__34964 < len__34963)) {
      var G__34966 = i__34964 + 1;
      var G__34967 = cljs.core.assoc.call(null, out__34965, ks[i__34964], vs[i__34964]);
      i__34964 = G__34966;
      out__34965 = G__34967;
      continue
    }else {
      return out__34965
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__34968 = cljs.core.seq.call(null, keyvals);
    var out__34969 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__34968)) {
        var G__34970 = cljs.core.nnext.call(null, in$__34968);
        var G__34971 = cljs.core.assoc.call(null, out__34969, cljs.core.first.call(null, in$__34968), cljs.core.second.call(null, in$__34968));
        in$__34968 = G__34970;
        out__34969 = G__34971;
        continue
      }else {
        return out__34969
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
  hash_map.cljs$lang$applyTo = function(arglist__34972) {
    var keyvals = cljs.core.seq(arglist__34972);
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
      return cljs.core.reduce.call(null, function(p1__34973_SHARP_, p2__34974_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____34975 = p1__34973_SHARP_;
          if(cljs.core.truth_(or__3548__auto____34975)) {
            return or__3548__auto____34975
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__34974_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__34976) {
    var maps = cljs.core.seq(arglist__34976);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__34979 = function(m, e) {
        var k__34977 = cljs.core.first.call(null, e);
        var v__34978 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__34977))) {
          return cljs.core.assoc.call(null, m, k__34977, f.call(null, cljs.core.get.call(null, m, k__34977), v__34978))
        }else {
          return cljs.core.assoc.call(null, m, k__34977, v__34978)
        }
      };
      var merge2__34981 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__34979, function() {
          var or__3548__auto____34980 = m1;
          if(cljs.core.truth_(or__3548__auto____34980)) {
            return or__3548__auto____34980
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__34981, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__34982) {
    var f = cljs.core.first(arglist__34982);
    var maps = cljs.core.rest(arglist__34982);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__34984 = cljs.core.ObjMap.fromObject([], {});
  var keys__34985 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__34985)) {
      var key__34986 = cljs.core.first.call(null, keys__34985);
      var entry__34987 = cljs.core.get.call(null, map, key__34986, "\ufdd0'user/not-found");
      var G__34988 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__34987, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__34984, key__34986, entry__34987) : ret__34984;
      var G__34989 = cljs.core.next.call(null, keys__34985);
      ret__34984 = G__34988;
      keys__34985 = G__34989;
      continue
    }else {
      return ret__34984
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
  var this__34990 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__35011 = null;
  var G__35011__35012 = function(coll, v) {
    var this__34991 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__35011__35013 = function(coll, v, not_found) {
    var this__34992 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__34992.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__35011 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__35011__35012.call(this, coll, v);
      case 3:
        return G__35011__35013.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__35011
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__35015 = null;
  var G__35015__35016 = function(tsym34993, k) {
    var this__34995 = this;
    var tsym34993__34996 = this;
    var coll__34997 = tsym34993__34996;
    return cljs.core._lookup.call(null, coll__34997, k)
  };
  var G__35015__35017 = function(tsym34994, k, not_found) {
    var this__34998 = this;
    var tsym34994__34999 = this;
    var coll__35000 = tsym34994__34999;
    return cljs.core._lookup.call(null, coll__35000, k, not_found)
  };
  G__35015 = function(tsym34994, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__35015__35016.call(this, tsym34994, k);
      case 3:
        return G__35015__35017.call(this, tsym34994, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__35015
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__35001 = this;
  return new cljs.core.Set(this__35001.meta, cljs.core.assoc.call(null, this__35001.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__35002 = this;
  return cljs.core.keys.call(null, this__35002.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__35003 = this;
  return new cljs.core.Set(this__35003.meta, cljs.core.dissoc.call(null, this__35003.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__35004 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__35005 = this;
  var and__3546__auto____35006 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____35006)) {
    var and__3546__auto____35007 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____35007)) {
      return cljs.core.every_QMARK_.call(null, function(p1__34983_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__34983_SHARP_)
      }, other)
    }else {
      return and__3546__auto____35007
    }
  }else {
    return and__3546__auto____35006
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__35008 = this;
  return new cljs.core.Set(meta, this__35008.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__35009 = this;
  return this__35009.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__35010 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__35010.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__35020 = cljs.core.seq.call(null, coll);
  var out__35021 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__35020)))) {
      var G__35022 = cljs.core.rest.call(null, in$__35020);
      var G__35023 = cljs.core.conj.call(null, out__35021, cljs.core.first.call(null, in$__35020));
      in$__35020 = G__35022;
      out__35021 = G__35023;
      continue
    }else {
      return out__35021
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__35024 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____35025 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____35025)) {
        var e__35026 = temp__3695__auto____35025;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__35026))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__35024, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__35019_SHARP_) {
      var temp__3695__auto____35027 = cljs.core.find.call(null, smap, p1__35019_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____35027)) {
        var e__35028 = temp__3695__auto____35027;
        return cljs.core.second.call(null, e__35028)
      }else {
        return p1__35019_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__35036 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__35029, seen) {
        while(true) {
          var vec__35030__35031 = p__35029;
          var f__35032 = cljs.core.nth.call(null, vec__35030__35031, 0, null);
          var xs__35033 = vec__35030__35031;
          var temp__3698__auto____35034 = cljs.core.seq.call(null, xs__35033);
          if(cljs.core.truth_(temp__3698__auto____35034)) {
            var s__35035 = temp__3698__auto____35034;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__35032))) {
              var G__35037 = cljs.core.rest.call(null, s__35035);
              var G__35038 = seen;
              p__35029 = G__35037;
              seen = G__35038;
              continue
            }else {
              return cljs.core.cons.call(null, f__35032, step.call(null, cljs.core.rest.call(null, s__35035), cljs.core.conj.call(null, seen, f__35032)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__35036.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__35039 = cljs.core.Vector.fromArray([]);
  var s__35040 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__35040))) {
      var G__35041 = cljs.core.conj.call(null, ret__35039, cljs.core.first.call(null, s__35040));
      var G__35042 = cljs.core.next.call(null, s__35040);
      ret__35039 = G__35041;
      s__35040 = G__35042;
      continue
    }else {
      return cljs.core.seq.call(null, ret__35039)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____35043 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____35043)) {
        return or__3548__auto____35043
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__35044 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__35044 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__35044 + 1)
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
    var or__3548__auto____35045 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____35045)) {
      return or__3548__auto____35045
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__35046 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__35046 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__35046)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__35049 = cljs.core.ObjMap.fromObject([], {});
  var ks__35050 = cljs.core.seq.call(null, keys);
  var vs__35051 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____35052 = ks__35050;
      if(cljs.core.truth_(and__3546__auto____35052)) {
        return vs__35051
      }else {
        return and__3546__auto____35052
      }
    }())) {
      var G__35053 = cljs.core.assoc.call(null, map__35049, cljs.core.first.call(null, ks__35050), cljs.core.first.call(null, vs__35051));
      var G__35054 = cljs.core.next.call(null, ks__35050);
      var G__35055 = cljs.core.next.call(null, vs__35051);
      map__35049 = G__35053;
      ks__35050 = G__35054;
      vs__35051 = G__35055;
      continue
    }else {
      return map__35049
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__35058 = function(k, x) {
    return x
  };
  var max_key__35059 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__35060 = function() {
    var G__35062__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__35047_SHARP_, p2__35048_SHARP_) {
        return max_key.call(null, k, p1__35047_SHARP_, p2__35048_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__35062 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__35062__delegate.call(this, k, x, y, more)
    };
    G__35062.cljs$lang$maxFixedArity = 3;
    G__35062.cljs$lang$applyTo = function(arglist__35063) {
      var k = cljs.core.first(arglist__35063);
      var x = cljs.core.first(cljs.core.next(arglist__35063));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__35063)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__35063)));
      return G__35062__delegate.call(this, k, x, y, more)
    };
    return G__35062
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__35058.call(this, k, x);
      case 3:
        return max_key__35059.call(this, k, x, y);
      default:
        return max_key__35060.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__35060.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__35064 = function(k, x) {
    return x
  };
  var min_key__35065 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__35066 = function() {
    var G__35068__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__35056_SHARP_, p2__35057_SHARP_) {
        return min_key.call(null, k, p1__35056_SHARP_, p2__35057_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__35068 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__35068__delegate.call(this, k, x, y, more)
    };
    G__35068.cljs$lang$maxFixedArity = 3;
    G__35068.cljs$lang$applyTo = function(arglist__35069) {
      var k = cljs.core.first(arglist__35069);
      var x = cljs.core.first(cljs.core.next(arglist__35069));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__35069)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__35069)));
      return G__35068__delegate.call(this, k, x, y, more)
    };
    return G__35068
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__35064.call(this, k, x);
      case 3:
        return min_key__35065.call(this, k, x, y);
      default:
        return min_key__35066.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__35066.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__35072 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__35073 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____35070 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____35070)) {
        var s__35071 = temp__3698__auto____35070;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__35071), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__35071)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__35072.call(this, n, step);
      case 3:
        return partition_all__35073.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____35075 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____35075)) {
      var s__35076 = temp__3698__auto____35075;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__35076)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__35076), take_while.call(null, pred, cljs.core.rest.call(null, s__35076)))
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
  var this__35077 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__35078 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__35094 = null;
  var G__35094__35095 = function(rng, f) {
    var this__35079 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__35094__35096 = function(rng, f, s) {
    var this__35080 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__35094 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__35094__35095.call(this, rng, f);
      case 3:
        return G__35094__35096.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__35094
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__35081 = this;
  var comp__35082 = cljs.core.truth_(this__35081.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__35082.call(null, this__35081.start, this__35081.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__35083 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__35083.end - this__35083.start) / this__35083.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__35084 = this;
  return this__35084.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__35085 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__35085.meta, this__35085.start + this__35085.step, this__35085.end, this__35085.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__35086 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__35087 = this;
  return new cljs.core.Range(meta, this__35087.start, this__35087.end, this__35087.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__35088 = this;
  return this__35088.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__35098 = null;
  var G__35098__35099 = function(rng, n) {
    var this__35089 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__35089.start + n * this__35089.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____35090 = this__35089.start > this__35089.end;
        if(cljs.core.truth_(and__3546__auto____35090)) {
          return cljs.core._EQ_.call(null, this__35089.step, 0)
        }else {
          return and__3546__auto____35090
        }
      }())) {
        return this__35089.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__35098__35100 = function(rng, n, not_found) {
    var this__35091 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__35091.start + n * this__35091.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____35092 = this__35091.start > this__35091.end;
        if(cljs.core.truth_(and__3546__auto____35092)) {
          return cljs.core._EQ_.call(null, this__35091.step, 0)
        }else {
          return and__3546__auto____35092
        }
      }())) {
        return this__35091.start
      }else {
        return not_found
      }
    }
  };
  G__35098 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__35098__35099.call(this, rng, n);
      case 3:
        return G__35098__35100.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__35098
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__35093 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__35093.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__35102 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__35103 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__35104 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__35105 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__35102.call(this);
      case 1:
        return range__35103.call(this, start);
      case 2:
        return range__35104.call(this, start, end);
      case 3:
        return range__35105.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____35107 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____35107)) {
      var s__35108 = temp__3698__auto____35107;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__35108), take_nth.call(null, n, cljs.core.drop.call(null, n, s__35108)))
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
    var temp__3698__auto____35110 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____35110)) {
      var s__35111 = temp__3698__auto____35110;
      var fst__35112 = cljs.core.first.call(null, s__35111);
      var fv__35113 = f.call(null, fst__35112);
      var run__35114 = cljs.core.cons.call(null, fst__35112, cljs.core.take_while.call(null, function(p1__35109_SHARP_) {
        return cljs.core._EQ_.call(null, fv__35113, f.call(null, p1__35109_SHARP_))
      }, cljs.core.next.call(null, s__35111)));
      return cljs.core.cons.call(null, run__35114, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__35114), s__35111))))
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
  var reductions__35129 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____35125 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____35125)) {
        var s__35126 = temp__3695__auto____35125;
        return reductions.call(null, f, cljs.core.first.call(null, s__35126), cljs.core.rest.call(null, s__35126))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__35130 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____35127 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____35127)) {
        var s__35128 = temp__3698__auto____35127;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__35128)), cljs.core.rest.call(null, s__35128))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__35129.call(this, f, init);
      case 3:
        return reductions__35130.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__35133 = function(f) {
    return function() {
      var G__35138 = null;
      var G__35138__35139 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__35138__35140 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__35138__35141 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__35138__35142 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__35138__35143 = function() {
        var G__35145__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__35145 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__35145__delegate.call(this, x, y, z, args)
        };
        G__35145.cljs$lang$maxFixedArity = 3;
        G__35145.cljs$lang$applyTo = function(arglist__35146) {
          var x = cljs.core.first(arglist__35146);
          var y = cljs.core.first(cljs.core.next(arglist__35146));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__35146)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__35146)));
          return G__35145__delegate.call(this, x, y, z, args)
        };
        return G__35145
      }();
      G__35138 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__35138__35139.call(this);
          case 1:
            return G__35138__35140.call(this, x);
          case 2:
            return G__35138__35141.call(this, x, y);
          case 3:
            return G__35138__35142.call(this, x, y, z);
          default:
            return G__35138__35143.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__35138.cljs$lang$maxFixedArity = 3;
      G__35138.cljs$lang$applyTo = G__35138__35143.cljs$lang$applyTo;
      return G__35138
    }()
  };
  var juxt__35134 = function(f, g) {
    return function() {
      var G__35147 = null;
      var G__35147__35148 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__35147__35149 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__35147__35150 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__35147__35151 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__35147__35152 = function() {
        var G__35154__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__35154 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__35154__delegate.call(this, x, y, z, args)
        };
        G__35154.cljs$lang$maxFixedArity = 3;
        G__35154.cljs$lang$applyTo = function(arglist__35155) {
          var x = cljs.core.first(arglist__35155);
          var y = cljs.core.first(cljs.core.next(arglist__35155));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__35155)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__35155)));
          return G__35154__delegate.call(this, x, y, z, args)
        };
        return G__35154
      }();
      G__35147 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__35147__35148.call(this);
          case 1:
            return G__35147__35149.call(this, x);
          case 2:
            return G__35147__35150.call(this, x, y);
          case 3:
            return G__35147__35151.call(this, x, y, z);
          default:
            return G__35147__35152.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__35147.cljs$lang$maxFixedArity = 3;
      G__35147.cljs$lang$applyTo = G__35147__35152.cljs$lang$applyTo;
      return G__35147
    }()
  };
  var juxt__35135 = function(f, g, h) {
    return function() {
      var G__35156 = null;
      var G__35156__35157 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__35156__35158 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__35156__35159 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__35156__35160 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__35156__35161 = function() {
        var G__35163__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__35163 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__35163__delegate.call(this, x, y, z, args)
        };
        G__35163.cljs$lang$maxFixedArity = 3;
        G__35163.cljs$lang$applyTo = function(arglist__35164) {
          var x = cljs.core.first(arglist__35164);
          var y = cljs.core.first(cljs.core.next(arglist__35164));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__35164)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__35164)));
          return G__35163__delegate.call(this, x, y, z, args)
        };
        return G__35163
      }();
      G__35156 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__35156__35157.call(this);
          case 1:
            return G__35156__35158.call(this, x);
          case 2:
            return G__35156__35159.call(this, x, y);
          case 3:
            return G__35156__35160.call(this, x, y, z);
          default:
            return G__35156__35161.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__35156.cljs$lang$maxFixedArity = 3;
      G__35156.cljs$lang$applyTo = G__35156__35161.cljs$lang$applyTo;
      return G__35156
    }()
  };
  var juxt__35136 = function() {
    var G__35165__delegate = function(f, g, h, fs) {
      var fs__35132 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__35166 = null;
        var G__35166__35167 = function() {
          return cljs.core.reduce.call(null, function(p1__35115_SHARP_, p2__35116_SHARP_) {
            return cljs.core.conj.call(null, p1__35115_SHARP_, p2__35116_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__35132)
        };
        var G__35166__35168 = function(x) {
          return cljs.core.reduce.call(null, function(p1__35117_SHARP_, p2__35118_SHARP_) {
            return cljs.core.conj.call(null, p1__35117_SHARP_, p2__35118_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__35132)
        };
        var G__35166__35169 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__35119_SHARP_, p2__35120_SHARP_) {
            return cljs.core.conj.call(null, p1__35119_SHARP_, p2__35120_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__35132)
        };
        var G__35166__35170 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__35121_SHARP_, p2__35122_SHARP_) {
            return cljs.core.conj.call(null, p1__35121_SHARP_, p2__35122_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__35132)
        };
        var G__35166__35171 = function() {
          var G__35173__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__35123_SHARP_, p2__35124_SHARP_) {
              return cljs.core.conj.call(null, p1__35123_SHARP_, cljs.core.apply.call(null, p2__35124_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__35132)
          };
          var G__35173 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__35173__delegate.call(this, x, y, z, args)
          };
          G__35173.cljs$lang$maxFixedArity = 3;
          G__35173.cljs$lang$applyTo = function(arglist__35174) {
            var x = cljs.core.first(arglist__35174);
            var y = cljs.core.first(cljs.core.next(arglist__35174));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__35174)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__35174)));
            return G__35173__delegate.call(this, x, y, z, args)
          };
          return G__35173
        }();
        G__35166 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__35166__35167.call(this);
            case 1:
              return G__35166__35168.call(this, x);
            case 2:
              return G__35166__35169.call(this, x, y);
            case 3:
              return G__35166__35170.call(this, x, y, z);
            default:
              return G__35166__35171.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__35166.cljs$lang$maxFixedArity = 3;
        G__35166.cljs$lang$applyTo = G__35166__35171.cljs$lang$applyTo;
        return G__35166
      }()
    };
    var G__35165 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__35165__delegate.call(this, f, g, h, fs)
    };
    G__35165.cljs$lang$maxFixedArity = 3;
    G__35165.cljs$lang$applyTo = function(arglist__35175) {
      var f = cljs.core.first(arglist__35175);
      var g = cljs.core.first(cljs.core.next(arglist__35175));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__35175)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__35175)));
      return G__35165__delegate.call(this, f, g, h, fs)
    };
    return G__35165
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__35133.call(this, f);
      case 2:
        return juxt__35134.call(this, f, g);
      case 3:
        return juxt__35135.call(this, f, g, h);
      default:
        return juxt__35136.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__35136.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__35177 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__35180 = cljs.core.next.call(null, coll);
        coll = G__35180;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__35178 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____35176 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____35176)) {
          return n > 0
        }else {
          return and__3546__auto____35176
        }
      }())) {
        var G__35181 = n - 1;
        var G__35182 = cljs.core.next.call(null, coll);
        n = G__35181;
        coll = G__35182;
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
        return dorun__35177.call(this, n);
      case 2:
        return dorun__35178.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__35183 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__35184 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__35183.call(this, n);
      case 2:
        return doall__35184.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__35186 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__35186), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__35186), 1))) {
      return cljs.core.first.call(null, matches__35186)
    }else {
      return cljs.core.vec.call(null, matches__35186)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__35187 = re.exec(s);
  if(cljs.core.truth_(matches__35187 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__35187), 1))) {
      return cljs.core.first.call(null, matches__35187)
    }else {
      return cljs.core.vec.call(null, matches__35187)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__35188 = cljs.core.re_find.call(null, re, s);
  var match_idx__35189 = s.search(re);
  var match_str__35190 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__35188)) ? cljs.core.first.call(null, match_data__35188) : match_data__35188;
  var post_match__35191 = cljs.core.subs.call(null, s, match_idx__35189 + cljs.core.count.call(null, match_str__35190));
  if(cljs.core.truth_(match_data__35188)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__35188, re_seq.call(null, re, post_match__35191))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__35193__35194 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___35195 = cljs.core.nth.call(null, vec__35193__35194, 0, null);
  var flags__35196 = cljs.core.nth.call(null, vec__35193__35194, 1, null);
  var pattern__35197 = cljs.core.nth.call(null, vec__35193__35194, 2, null);
  return new RegExp(pattern__35197, flags__35196)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__35192_SHARP_) {
    return print_one.call(null, p1__35192_SHARP_, opts)
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
          var and__3546__auto____35198 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____35198)) {
            var and__3546__auto____35202 = function() {
              var x__450__auto____35199 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____35200 = x__450__auto____35199;
                if(cljs.core.truth_(and__3546__auto____35200)) {
                  var and__3546__auto____35201 = x__450__auto____35199.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____35201)) {
                    return cljs.core.not.call(null, x__450__auto____35199.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____35201
                  }
                }else {
                  return and__3546__auto____35200
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____35199)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____35202)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____35202
            }
          }else {
            return and__3546__auto____35198
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__450__auto____35203 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____35204 = x__450__auto____35203;
            if(cljs.core.truth_(and__3546__auto____35204)) {
              var and__3546__auto____35205 = x__450__auto____35203.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____35205)) {
                return cljs.core.not.call(null, x__450__auto____35203.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____35205
              }
            }else {
              return and__3546__auto____35204
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__450__auto____35203)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__35206 = cljs.core.first.call(null, objs);
  var sb__35207 = new goog.string.StringBuffer;
  var G__35208__35209 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__35208__35209)) {
    var obj__35210 = cljs.core.first.call(null, G__35208__35209);
    var G__35208__35211 = G__35208__35209;
    while(true) {
      if(cljs.core.truth_(obj__35210 === first_obj__35206)) {
      }else {
        sb__35207.append(" ")
      }
      var G__35212__35213 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__35210, opts));
      if(cljs.core.truth_(G__35212__35213)) {
        var string__35214 = cljs.core.first.call(null, G__35212__35213);
        var G__35212__35215 = G__35212__35213;
        while(true) {
          sb__35207.append(string__35214);
          var temp__3698__auto____35216 = cljs.core.next.call(null, G__35212__35215);
          if(cljs.core.truth_(temp__3698__auto____35216)) {
            var G__35212__35217 = temp__3698__auto____35216;
            var G__35220 = cljs.core.first.call(null, G__35212__35217);
            var G__35221 = G__35212__35217;
            string__35214 = G__35220;
            G__35212__35215 = G__35221;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____35218 = cljs.core.next.call(null, G__35208__35211);
      if(cljs.core.truth_(temp__3698__auto____35218)) {
        var G__35208__35219 = temp__3698__auto____35218;
        var G__35222 = cljs.core.first.call(null, G__35208__35219);
        var G__35223 = G__35208__35219;
        obj__35210 = G__35222;
        G__35208__35211 = G__35223;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__35207)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__35224 = cljs.core.first.call(null, objs);
  var G__35225__35226 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__35225__35226)) {
    var obj__35227 = cljs.core.first.call(null, G__35225__35226);
    var G__35225__35228 = G__35225__35226;
    while(true) {
      if(cljs.core.truth_(obj__35227 === first_obj__35224)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__35229__35230 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__35227, opts));
      if(cljs.core.truth_(G__35229__35230)) {
        var string__35231 = cljs.core.first.call(null, G__35229__35230);
        var G__35229__35232 = G__35229__35230;
        while(true) {
          cljs.core.string_print.call(null, string__35231);
          var temp__3698__auto____35233 = cljs.core.next.call(null, G__35229__35232);
          if(cljs.core.truth_(temp__3698__auto____35233)) {
            var G__35229__35234 = temp__3698__auto____35233;
            var G__35237 = cljs.core.first.call(null, G__35229__35234);
            var G__35238 = G__35229__35234;
            string__35231 = G__35237;
            G__35229__35232 = G__35238;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____35235 = cljs.core.next.call(null, G__35225__35228);
      if(cljs.core.truth_(temp__3698__auto____35235)) {
        var G__35225__35236 = temp__3698__auto____35235;
        var G__35239 = cljs.core.first.call(null, G__35225__35236);
        var G__35240 = G__35225__35236;
        obj__35227 = G__35239;
        G__35225__35228 = G__35240;
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
  pr_str.cljs$lang$applyTo = function(arglist__35241) {
    var objs = cljs.core.seq(arglist__35241);
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
  pr.cljs$lang$applyTo = function(arglist__35242) {
    var objs = cljs.core.seq(arglist__35242);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__35243) {
    var objs = cljs.core.seq(arglist__35243);
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
  println.cljs$lang$applyTo = function(arglist__35244) {
    var objs = cljs.core.seq(arglist__35244);
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
  prn.cljs$lang$applyTo = function(arglist__35245) {
    var objs = cljs.core.seq(arglist__35245);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__35246 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__35246, "{", ", ", "}", opts, coll)
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
      var temp__3698__auto____35247 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____35247)) {
        var nspc__35248 = temp__3698__auto____35247;
        return cljs.core.str.call(null, nspc__35248, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____35249 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____35249)) {
          var nspc__35250 = temp__3698__auto____35249;
          return cljs.core.str.call(null, nspc__35250, "/")
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
  var pr_pair__35251 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__35251, "{", ", ", "}", opts, coll)
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
  var this__35252 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__35253 = this;
  var G__35254__35255 = cljs.core.seq.call(null, this__35253.watches);
  if(cljs.core.truth_(G__35254__35255)) {
    var G__35257__35259 = cljs.core.first.call(null, G__35254__35255);
    var vec__35258__35260 = G__35257__35259;
    var key__35261 = cljs.core.nth.call(null, vec__35258__35260, 0, null);
    var f__35262 = cljs.core.nth.call(null, vec__35258__35260, 1, null);
    var G__35254__35263 = G__35254__35255;
    var G__35257__35264 = G__35257__35259;
    var G__35254__35265 = G__35254__35263;
    while(true) {
      var vec__35266__35267 = G__35257__35264;
      var key__35268 = cljs.core.nth.call(null, vec__35266__35267, 0, null);
      var f__35269 = cljs.core.nth.call(null, vec__35266__35267, 1, null);
      var G__35254__35270 = G__35254__35265;
      f__35269.call(null, key__35268, this$, oldval, newval);
      var temp__3698__auto____35271 = cljs.core.next.call(null, G__35254__35270);
      if(cljs.core.truth_(temp__3698__auto____35271)) {
        var G__35254__35272 = temp__3698__auto____35271;
        var G__35279 = cljs.core.first.call(null, G__35254__35272);
        var G__35280 = G__35254__35272;
        G__35257__35264 = G__35279;
        G__35254__35265 = G__35280;
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
  var this__35273 = this;
  return this$.watches = cljs.core.assoc.call(null, this__35273.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__35274 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__35274.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__35275 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__35275.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__35276 = this;
  return this__35276.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__35277 = this;
  return this__35277.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__35278 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__35287 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__35288 = function() {
    var G__35290__delegate = function(x, p__35281) {
      var map__35282__35283 = p__35281;
      var map__35282__35284 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__35282__35283)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__35282__35283) : map__35282__35283;
      var validator__35285 = cljs.core.get.call(null, map__35282__35284, "\ufdd0'validator");
      var meta__35286 = cljs.core.get.call(null, map__35282__35284, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__35286, validator__35285, null)
    };
    var G__35290 = function(x, var_args) {
      var p__35281 = null;
      if(goog.isDef(var_args)) {
        p__35281 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__35290__delegate.call(this, x, p__35281)
    };
    G__35290.cljs$lang$maxFixedArity = 1;
    G__35290.cljs$lang$applyTo = function(arglist__35291) {
      var x = cljs.core.first(arglist__35291);
      var p__35281 = cljs.core.rest(arglist__35291);
      return G__35290__delegate.call(this, x, p__35281)
    };
    return G__35290
  }();
  atom = function(x, var_args) {
    var p__35281 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__35287.call(this, x);
      default:
        return atom__35288.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__35288.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____35292 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____35292)) {
    var validate__35293 = temp__3698__auto____35292;
    if(cljs.core.truth_(validate__35293.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3073)))));
    }
  }else {
  }
  var old_value__35294 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__35294, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___35295 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___35296 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___35297 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___35298 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___35299 = function() {
    var G__35301__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__35301 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__35301__delegate.call(this, a, f, x, y, z, more)
    };
    G__35301.cljs$lang$maxFixedArity = 5;
    G__35301.cljs$lang$applyTo = function(arglist__35302) {
      var a = cljs.core.first(arglist__35302);
      var f = cljs.core.first(cljs.core.next(arglist__35302));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__35302)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__35302))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__35302)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__35302)))));
      return G__35301__delegate.call(this, a, f, x, y, z, more)
    };
    return G__35301
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___35295.call(this, a, f);
      case 3:
        return swap_BANG___35296.call(this, a, f, x);
      case 4:
        return swap_BANG___35297.call(this, a, f, x, y);
      case 5:
        return swap_BANG___35298.call(this, a, f, x, y, z);
      default:
        return swap_BANG___35299.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___35299.cljs$lang$applyTo;
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__35303) {
    var iref = cljs.core.first(arglist__35303);
    var f = cljs.core.first(cljs.core.next(arglist__35303));
    var args = cljs.core.rest(cljs.core.next(arglist__35303));
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
  var gensym__35304 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__35305 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__35304.call(this);
      case 1:
        return gensym__35305.call(this, prefix_string)
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
  var this__35307 = this;
  return cljs.core.not.call(null, cljs.core.deref.call(null, this__35307.state) === null)
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__35308 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__35308.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__35308.state, this__35308.f)
  }
  return cljs.core.deref.call(null, this__35308.state)
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
  delay.cljs$lang$applyTo = function(arglist__35309) {
    var body = cljs.core.seq(arglist__35309);
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
    var map__35310__35311 = options;
    var map__35310__35312 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__35310__35311)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__35310__35311) : map__35310__35311;
    var keywordize_keys__35313 = cljs.core.get.call(null, map__35310__35312, "\ufdd0'keywordize-keys");
    var keyfn__35314 = cljs.core.truth_(keywordize_keys__35313) ? cljs.core.keyword : cljs.core.str;
    var f__35320 = function thisfn(x) {
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
                var iter__514__auto____35319 = function iter__35315(s__35316) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__35316__35317 = s__35316;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__35316__35317))) {
                        var k__35318 = cljs.core.first.call(null, s__35316__35317);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__35314.call(null, k__35318), thisfn.call(null, x[k__35318])]), iter__35315.call(null, cljs.core.rest.call(null, s__35316__35317)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__514__auto____35319.call(null, cljs.core.js_keys.call(null, x))
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
    return f__35320.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__35321) {
    var x = cljs.core.first(arglist__35321);
    var options = cljs.core.rest(arglist__35321);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__35322 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__35326__delegate = function(args) {
      var temp__3695__auto____35323 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__35322), args);
      if(cljs.core.truth_(temp__3695__auto____35323)) {
        var v__35324 = temp__3695__auto____35323;
        return v__35324
      }else {
        var ret__35325 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__35322, cljs.core.assoc, args, ret__35325);
        return ret__35325
      }
    };
    var G__35326 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__35326__delegate.call(this, args)
    };
    G__35326.cljs$lang$maxFixedArity = 0;
    G__35326.cljs$lang$applyTo = function(arglist__35327) {
      var args = cljs.core.seq(arglist__35327);
      return G__35326__delegate.call(this, args)
    };
    return G__35326
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__35329 = function(f) {
    while(true) {
      var ret__35328 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__35328))) {
        var G__35332 = ret__35328;
        f = G__35332;
        continue
      }else {
        return ret__35328
      }
      break
    }
  };
  var trampoline__35330 = function() {
    var G__35333__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__35333 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__35333__delegate.call(this, f, args)
    };
    G__35333.cljs$lang$maxFixedArity = 1;
    G__35333.cljs$lang$applyTo = function(arglist__35334) {
      var f = cljs.core.first(arglist__35334);
      var args = cljs.core.rest(arglist__35334);
      return G__35333__delegate.call(this, f, args)
    };
    return G__35333
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__35329.call(this, f);
      default:
        return trampoline__35330.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__35330.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__35335 = function() {
    return rand.call(null, 1)
  };
  var rand__35336 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__35335.call(this);
      case 1:
        return rand__35336.call(this, n)
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
    var k__35338 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__35338, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__35338, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___35347 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___35348 = function(h, child, parent) {
    var or__3548__auto____35339 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____35339)) {
      return or__3548__auto____35339
    }else {
      var or__3548__auto____35340 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____35340)) {
        return or__3548__auto____35340
      }else {
        var and__3546__auto____35341 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____35341)) {
          var and__3546__auto____35342 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____35342)) {
            var and__3546__auto____35343 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____35343)) {
              var ret__35344 = true;
              var i__35345 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____35346 = cljs.core.not.call(null, ret__35344);
                  if(cljs.core.truth_(or__3548__auto____35346)) {
                    return or__3548__auto____35346
                  }else {
                    return cljs.core._EQ_.call(null, i__35345, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__35344
                }else {
                  var G__35350 = isa_QMARK_.call(null, h, child.call(null, i__35345), parent.call(null, i__35345));
                  var G__35351 = i__35345 + 1;
                  ret__35344 = G__35350;
                  i__35345 = G__35351;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____35343
            }
          }else {
            return and__3546__auto____35342
          }
        }else {
          return and__3546__auto____35341
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___35347.call(this, h, child);
      case 3:
        return isa_QMARK___35348.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__35352 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__35353 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__35352.call(this, h);
      case 2:
        return parents__35353.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__35355 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__35356 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__35355.call(this, h);
      case 2:
        return ancestors__35356.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__35358 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__35359 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__35358.call(this, h);
      case 2:
        return descendants__35359.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__35369 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3365)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__35370 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3369)))));
    }
    var tp__35364 = "\ufdd0'parents".call(null, h);
    var td__35365 = "\ufdd0'descendants".call(null, h);
    var ta__35366 = "\ufdd0'ancestors".call(null, h);
    var tf__35367 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____35368 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__35364.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__35366.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__35366.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__35364, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__35367.call(null, "\ufdd0'ancestors".call(null, h), tag, td__35365, parent, ta__35366), "\ufdd0'descendants":tf__35367.call(null, "\ufdd0'descendants".call(null, h), parent, ta__35366, tag, td__35365)})
    }();
    if(cljs.core.truth_(or__3548__auto____35368)) {
      return or__3548__auto____35368
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__35369.call(this, h, tag);
      case 3:
        return derive__35370.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__35376 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__35377 = function(h, tag, parent) {
    var parentMap__35372 = "\ufdd0'parents".call(null, h);
    var childsParents__35373 = cljs.core.truth_(parentMap__35372.call(null, tag)) ? cljs.core.disj.call(null, parentMap__35372.call(null, tag), parent) : cljs.core.set([]);
    var newParents__35374 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__35373)) ? cljs.core.assoc.call(null, parentMap__35372, tag, childsParents__35373) : cljs.core.dissoc.call(null, parentMap__35372, tag);
    var deriv_seq__35375 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__35361_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__35361_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__35361_SHARP_), cljs.core.second.call(null, p1__35361_SHARP_)))
    }, cljs.core.seq.call(null, newParents__35374)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__35372.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__35362_SHARP_, p2__35363_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__35362_SHARP_, p2__35363_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__35375))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__35376.call(this, h, tag);
      case 3:
        return underive__35377.call(this, h, tag, parent)
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
  var xprefs__35379 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____35381 = cljs.core.truth_(function() {
    var and__3546__auto____35380 = xprefs__35379;
    if(cljs.core.truth_(and__3546__auto____35380)) {
      return xprefs__35379.call(null, y)
    }else {
      return and__3546__auto____35380
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____35381)) {
    return or__3548__auto____35381
  }else {
    var or__3548__auto____35383 = function() {
      var ps__35382 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__35382) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__35382), prefer_table))) {
          }else {
          }
          var G__35386 = cljs.core.rest.call(null, ps__35382);
          ps__35382 = G__35386;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____35383)) {
      return or__3548__auto____35383
    }else {
      var or__3548__auto____35385 = function() {
        var ps__35384 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__35384) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__35384), y, prefer_table))) {
            }else {
            }
            var G__35387 = cljs.core.rest.call(null, ps__35384);
            ps__35384 = G__35387;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____35385)) {
        return or__3548__auto____35385
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____35388 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____35388)) {
    return or__3548__auto____35388
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__35397 = cljs.core.reduce.call(null, function(be, p__35389) {
    var vec__35390__35391 = p__35389;
    var k__35392 = cljs.core.nth.call(null, vec__35390__35391, 0, null);
    var ___35393 = cljs.core.nth.call(null, vec__35390__35391, 1, null);
    var e__35394 = vec__35390__35391;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__35392))) {
      var be2__35396 = cljs.core.truth_(function() {
        var or__3548__auto____35395 = be === null;
        if(cljs.core.truth_(or__3548__auto____35395)) {
          return or__3548__auto____35395
        }else {
          return cljs.core.dominates.call(null, k__35392, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__35394 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__35396), k__35392, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__35392, " and ", cljs.core.first.call(null, be2__35396), ", and neither is preferred"));
      }
      return be2__35396
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__35397)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__35397));
      return cljs.core.second.call(null, best_entry__35397)
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
    var and__3546__auto____35398 = mf;
    if(cljs.core.truth_(and__3546__auto____35398)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____35398
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____35399 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____35399)) {
        return or__3548__auto____35399
      }else {
        var or__3548__auto____35400 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____35400)) {
          return or__3548__auto____35400
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____35401 = mf;
    if(cljs.core.truth_(and__3546__auto____35401)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____35401
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____35402 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____35402)) {
        return or__3548__auto____35402
      }else {
        var or__3548__auto____35403 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____35403)) {
          return or__3548__auto____35403
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____35404 = mf;
    if(cljs.core.truth_(and__3546__auto____35404)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____35404
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____35405 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____35405)) {
        return or__3548__auto____35405
      }else {
        var or__3548__auto____35406 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____35406)) {
          return or__3548__auto____35406
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____35407 = mf;
    if(cljs.core.truth_(and__3546__auto____35407)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____35407
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____35408 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____35408)) {
        return or__3548__auto____35408
      }else {
        var or__3548__auto____35409 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____35409)) {
          return or__3548__auto____35409
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____35410 = mf;
    if(cljs.core.truth_(and__3546__auto____35410)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____35410
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____35411 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____35411)) {
        return or__3548__auto____35411
      }else {
        var or__3548__auto____35412 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____35412)) {
          return or__3548__auto____35412
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____35413 = mf;
    if(cljs.core.truth_(and__3546__auto____35413)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____35413
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____35414 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____35414)) {
        return or__3548__auto____35414
      }else {
        var or__3548__auto____35415 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____35415)) {
          return or__3548__auto____35415
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____35416 = mf;
    if(cljs.core.truth_(and__3546__auto____35416)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____35416
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____35417 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____35417)) {
        return or__3548__auto____35417
      }else {
        var or__3548__auto____35418 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____35418)) {
          return or__3548__auto____35418
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____35419 = mf;
    if(cljs.core.truth_(and__3546__auto____35419)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____35419
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____35420 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____35420)) {
        return or__3548__auto____35420
      }else {
        var or__3548__auto____35421 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____35421)) {
          return or__3548__auto____35421
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__35422 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__35423 = cljs.core._get_method.call(null, mf, dispatch_val__35422);
  if(cljs.core.truth_(target_fn__35423)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__35422));
  }
  return cljs.core.apply.call(null, target_fn__35423, args)
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
  var this__35424 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__35425 = this;
  cljs.core.swap_BANG_.call(null, this__35425.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__35425.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__35425.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__35425.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__35426 = this;
  cljs.core.swap_BANG_.call(null, this__35426.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__35426.method_cache, this__35426.method_table, this__35426.cached_hierarchy, this__35426.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__35427 = this;
  cljs.core.swap_BANG_.call(null, this__35427.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__35427.method_cache, this__35427.method_table, this__35427.cached_hierarchy, this__35427.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__35428 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__35428.cached_hierarchy), cljs.core.deref.call(null, this__35428.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__35428.method_cache, this__35428.method_table, this__35428.cached_hierarchy, this__35428.hierarchy)
  }
  var temp__3695__auto____35429 = cljs.core.deref.call(null, this__35428.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____35429)) {
    var target_fn__35430 = temp__3695__auto____35429;
    return target_fn__35430
  }else {
    var temp__3695__auto____35431 = cljs.core.find_and_cache_best_method.call(null, this__35428.name, dispatch_val, this__35428.hierarchy, this__35428.method_table, this__35428.prefer_table, this__35428.method_cache, this__35428.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____35431)) {
      var target_fn__35432 = temp__3695__auto____35431;
      return target_fn__35432
    }else {
      return cljs.core.deref.call(null, this__35428.method_table).call(null, this__35428.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__35433 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__35433.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__35433.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__35433.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__35433.method_cache, this__35433.method_table, this__35433.cached_hierarchy, this__35433.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__35434 = this;
  return cljs.core.deref.call(null, this__35434.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__35435 = this;
  return cljs.core.deref.call(null, this__35435.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__35436 = this;
  return cljs.core.do_dispatch.call(null, mf, this__35436.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__35437__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__35437 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__35437__delegate.call(this, _, args)
  };
  G__35437.cljs$lang$maxFixedArity = 1;
  G__35437.cljs$lang$applyTo = function(arglist__35438) {
    var _ = cljs.core.first(arglist__35438);
    var args = cljs.core.rest(arglist__35438);
    return G__35437__delegate.call(this, _, args)
  };
  return G__35437
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
goog.provide("example.hello");
goog.require("cljs.core");
goog.require("goog.dom");
example.hello._STAR_grid_STAR_ = cljs.core.atom;
example.hello.by_id = function by_id(id) {
  return goog.dom.getElement(id)
};
example.hello.set_cell_state = function set_cell_state(x, y, state) {
  return example.hello.by_id.call(null, cljs.core.str.call(null, x, "-", y)).setAttribute("class", state)
};
example.hello.start = function start() {
  example.hello._STAR_grid_STAR_ = cljs.core.map.call(null, function() {
    if(cljs.core.truth_(0.3 < cljs.core.rand.call(null, 1))) {
      return"live"
    }else {
      return"dead"
    }
  }, cljs.core.range.call(null, 100));
  return example.hello.update_grid.call(null)
};
example.hello.update_grid = function update_grid() {
  return cljs.core.doall.call(null, cljs.core.map_indexed.call(null, function(p1__33736_SHARP_, p2__33737_SHARP_) {
    var x__33738 = p1__33736_SHARP_ % 10;
    var y__33739 = Math.floor.call(null, p1__33736_SHARP_ / 10);
    return example.hello.set_cell_state.call(null, x__33738, y__33739, p2__33737_SHARP_)
  }, example.hello._STAR_grid_STAR_))
};
window.onload = example.hello.start;
example.hello.setTimeout.call(null, example.hello.start, 500);
