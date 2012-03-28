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
  var or__3548__auto____27564 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____27564)) {
    return or__3548__auto____27564
  }else {
    var or__3548__auto____27565 = p["_"];
    if(cljs.core.truth_(or__3548__auto____27565)) {
      return or__3548__auto____27565
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
  var _invoke__27629 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27566 = this$;
      if(cljs.core.truth_(and__3546__auto____27566)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27566
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____27567 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27567)) {
          return or__3548__auto____27567
        }else {
          var or__3548__auto____27568 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27568)) {
            return or__3548__auto____27568
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__27630 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27569 = this$;
      if(cljs.core.truth_(and__3546__auto____27569)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27569
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____27570 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27570)) {
          return or__3548__auto____27570
        }else {
          var or__3548__auto____27571 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27571)) {
            return or__3548__auto____27571
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__27631 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27572 = this$;
      if(cljs.core.truth_(and__3546__auto____27572)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27572
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____27573 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27573)) {
          return or__3548__auto____27573
        }else {
          var or__3548__auto____27574 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27574)) {
            return or__3548__auto____27574
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__27632 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27575 = this$;
      if(cljs.core.truth_(and__3546__auto____27575)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27575
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____27576 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27576)) {
          return or__3548__auto____27576
        }else {
          var or__3548__auto____27577 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27577)) {
            return or__3548__auto____27577
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__27633 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27578 = this$;
      if(cljs.core.truth_(and__3546__auto____27578)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27578
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____27579 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27579)) {
          return or__3548__auto____27579
        }else {
          var or__3548__auto____27580 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27580)) {
            return or__3548__auto____27580
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__27634 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27581 = this$;
      if(cljs.core.truth_(and__3546__auto____27581)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27581
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____27582 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27582)) {
          return or__3548__auto____27582
        }else {
          var or__3548__auto____27583 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27583)) {
            return or__3548__auto____27583
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__27635 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27584 = this$;
      if(cljs.core.truth_(and__3546__auto____27584)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27584
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____27585 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27585)) {
          return or__3548__auto____27585
        }else {
          var or__3548__auto____27586 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27586)) {
            return or__3548__auto____27586
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__27636 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27587 = this$;
      if(cljs.core.truth_(and__3546__auto____27587)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27587
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____27588 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27588)) {
          return or__3548__auto____27588
        }else {
          var or__3548__auto____27589 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27589)) {
            return or__3548__auto____27589
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__27637 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27590 = this$;
      if(cljs.core.truth_(and__3546__auto____27590)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27590
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____27591 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27591)) {
          return or__3548__auto____27591
        }else {
          var or__3548__auto____27592 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27592)) {
            return or__3548__auto____27592
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__27638 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27593 = this$;
      if(cljs.core.truth_(and__3546__auto____27593)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27593
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____27594 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27594)) {
          return or__3548__auto____27594
        }else {
          var or__3548__auto____27595 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27595)) {
            return or__3548__auto____27595
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__27639 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27596 = this$;
      if(cljs.core.truth_(and__3546__auto____27596)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27596
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____27597 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27597)) {
          return or__3548__auto____27597
        }else {
          var or__3548__auto____27598 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27598)) {
            return or__3548__auto____27598
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__27640 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27599 = this$;
      if(cljs.core.truth_(and__3546__auto____27599)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27599
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____27600 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27600)) {
          return or__3548__auto____27600
        }else {
          var or__3548__auto____27601 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27601)) {
            return or__3548__auto____27601
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__27641 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27602 = this$;
      if(cljs.core.truth_(and__3546__auto____27602)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27602
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____27603 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27603)) {
          return or__3548__auto____27603
        }else {
          var or__3548__auto____27604 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27604)) {
            return or__3548__auto____27604
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__27642 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27605 = this$;
      if(cljs.core.truth_(and__3546__auto____27605)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27605
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____27606 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27606)) {
          return or__3548__auto____27606
        }else {
          var or__3548__auto____27607 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27607)) {
            return or__3548__auto____27607
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__27643 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27608 = this$;
      if(cljs.core.truth_(and__3546__auto____27608)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27608
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____27609 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27609)) {
          return or__3548__auto____27609
        }else {
          var or__3548__auto____27610 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27610)) {
            return or__3548__auto____27610
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__27644 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27611 = this$;
      if(cljs.core.truth_(and__3546__auto____27611)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27611
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____27612 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27612)) {
          return or__3548__auto____27612
        }else {
          var or__3548__auto____27613 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27613)) {
            return or__3548__auto____27613
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__27645 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27614 = this$;
      if(cljs.core.truth_(and__3546__auto____27614)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27614
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____27615 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27615)) {
          return or__3548__auto____27615
        }else {
          var or__3548__auto____27616 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27616)) {
            return or__3548__auto____27616
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__27646 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27617 = this$;
      if(cljs.core.truth_(and__3546__auto____27617)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27617
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____27618 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27618)) {
          return or__3548__auto____27618
        }else {
          var or__3548__auto____27619 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27619)) {
            return or__3548__auto____27619
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__27647 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27620 = this$;
      if(cljs.core.truth_(and__3546__auto____27620)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27620
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____27621 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27621)) {
          return or__3548__auto____27621
        }else {
          var or__3548__auto____27622 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27622)) {
            return or__3548__auto____27622
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__27648 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27623 = this$;
      if(cljs.core.truth_(and__3546__auto____27623)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27623
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____27624 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27624)) {
          return or__3548__auto____27624
        }else {
          var or__3548__auto____27625 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27625)) {
            return or__3548__auto____27625
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__27649 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27626 = this$;
      if(cljs.core.truth_(and__3546__auto____27626)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____27626
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____27627 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____27627)) {
          return or__3548__auto____27627
        }else {
          var or__3548__auto____27628 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____27628)) {
            return or__3548__auto____27628
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
        return _invoke__27629.call(this, this$);
      case 2:
        return _invoke__27630.call(this, this$, a);
      case 3:
        return _invoke__27631.call(this, this$, a, b);
      case 4:
        return _invoke__27632.call(this, this$, a, b, c);
      case 5:
        return _invoke__27633.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__27634.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__27635.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__27636.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__27637.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__27638.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__27639.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__27640.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__27641.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__27642.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__27643.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__27644.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__27645.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__27646.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__27647.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__27648.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__27649.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27651 = coll;
    if(cljs.core.truth_(and__3546__auto____27651)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____27651
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____27652 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27652)) {
        return or__3548__auto____27652
      }else {
        var or__3548__auto____27653 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____27653)) {
          return or__3548__auto____27653
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
    var and__3546__auto____27654 = coll;
    if(cljs.core.truth_(and__3546__auto____27654)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____27654
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____27655 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27655)) {
        return or__3548__auto____27655
      }else {
        var or__3548__auto____27656 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____27656)) {
          return or__3548__auto____27656
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
    var and__3546__auto____27657 = coll;
    if(cljs.core.truth_(and__3546__auto____27657)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____27657
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____27658 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27658)) {
        return or__3548__auto____27658
      }else {
        var or__3548__auto____27659 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____27659)) {
          return or__3548__auto____27659
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
  var _nth__27666 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27660 = coll;
      if(cljs.core.truth_(and__3546__auto____27660)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____27660
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____27661 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____27661)) {
          return or__3548__auto____27661
        }else {
          var or__3548__auto____27662 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____27662)) {
            return or__3548__auto____27662
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__27667 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27663 = coll;
      if(cljs.core.truth_(and__3546__auto____27663)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____27663
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____27664 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____27664)) {
          return or__3548__auto____27664
        }else {
          var or__3548__auto____27665 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____27665)) {
            return or__3548__auto____27665
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
        return _nth__27666.call(this, coll, n);
      case 3:
        return _nth__27667.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27669 = coll;
    if(cljs.core.truth_(and__3546__auto____27669)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____27669
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____27670 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27670)) {
        return or__3548__auto____27670
      }else {
        var or__3548__auto____27671 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____27671)) {
          return or__3548__auto____27671
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27672 = coll;
    if(cljs.core.truth_(and__3546__auto____27672)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____27672
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____27673 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27673)) {
        return or__3548__auto____27673
      }else {
        var or__3548__auto____27674 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____27674)) {
          return or__3548__auto____27674
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
  var _lookup__27681 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27675 = o;
      if(cljs.core.truth_(and__3546__auto____27675)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____27675
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____27676 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____27676)) {
          return or__3548__auto____27676
        }else {
          var or__3548__auto____27677 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____27677)) {
            return or__3548__auto____27677
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__27682 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27678 = o;
      if(cljs.core.truth_(and__3546__auto____27678)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____27678
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____27679 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____27679)) {
          return or__3548__auto____27679
        }else {
          var or__3548__auto____27680 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____27680)) {
            return or__3548__auto____27680
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
        return _lookup__27681.call(this, o, k);
      case 3:
        return _lookup__27682.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27684 = coll;
    if(cljs.core.truth_(and__3546__auto____27684)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____27684
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____27685 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27685)) {
        return or__3548__auto____27685
      }else {
        var or__3548__auto____27686 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____27686)) {
          return or__3548__auto____27686
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27687 = coll;
    if(cljs.core.truth_(and__3546__auto____27687)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____27687
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____27688 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27688)) {
        return or__3548__auto____27688
      }else {
        var or__3548__auto____27689 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____27689)) {
          return or__3548__auto____27689
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
    var and__3546__auto____27690 = coll;
    if(cljs.core.truth_(and__3546__auto____27690)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____27690
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____27691 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27691)) {
        return or__3548__auto____27691
      }else {
        var or__3548__auto____27692 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____27692)) {
          return or__3548__auto____27692
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
    var and__3546__auto____27693 = coll;
    if(cljs.core.truth_(and__3546__auto____27693)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____27693
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____27694 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27694)) {
        return or__3548__auto____27694
      }else {
        var or__3548__auto____27695 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____27695)) {
          return or__3548__auto____27695
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
    var and__3546__auto____27696 = coll;
    if(cljs.core.truth_(and__3546__auto____27696)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____27696
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____27697 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27697)) {
        return or__3548__auto____27697
      }else {
        var or__3548__auto____27698 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____27698)) {
          return or__3548__auto____27698
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27699 = coll;
    if(cljs.core.truth_(and__3546__auto____27699)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____27699
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____27700 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27700)) {
        return or__3548__auto____27700
      }else {
        var or__3548__auto____27701 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____27701)) {
          return or__3548__auto____27701
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
    var and__3546__auto____27702 = coll;
    if(cljs.core.truth_(and__3546__auto____27702)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____27702
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____27703 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____27703)) {
        return or__3548__auto____27703
      }else {
        var or__3548__auto____27704 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____27704)) {
          return or__3548__auto____27704
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
    var and__3546__auto____27705 = o;
    if(cljs.core.truth_(and__3546__auto____27705)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____27705
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____27706 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____27706)) {
        return or__3548__auto____27706
      }else {
        var or__3548__auto____27707 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____27707)) {
          return or__3548__auto____27707
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
    var and__3546__auto____27708 = o;
    if(cljs.core.truth_(and__3546__auto____27708)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____27708
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____27709 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____27709)) {
        return or__3548__auto____27709
      }else {
        var or__3548__auto____27710 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____27710)) {
          return or__3548__auto____27710
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
    var and__3546__auto____27711 = o;
    if(cljs.core.truth_(and__3546__auto____27711)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____27711
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____27712 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____27712)) {
        return or__3548__auto____27712
      }else {
        var or__3548__auto____27713 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____27713)) {
          return or__3548__auto____27713
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
    var and__3546__auto____27714 = o;
    if(cljs.core.truth_(and__3546__auto____27714)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____27714
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____27715 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____27715)) {
        return or__3548__auto____27715
      }else {
        var or__3548__auto____27716 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____27716)) {
          return or__3548__auto____27716
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
  var _reduce__27723 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27717 = coll;
      if(cljs.core.truth_(and__3546__auto____27717)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____27717
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____27718 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____27718)) {
          return or__3548__auto____27718
        }else {
          var or__3548__auto____27719 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____27719)) {
            return or__3548__auto____27719
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__27724 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____27720 = coll;
      if(cljs.core.truth_(and__3546__auto____27720)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____27720
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____27721 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____27721)) {
          return or__3548__auto____27721
        }else {
          var or__3548__auto____27722 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____27722)) {
            return or__3548__auto____27722
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
        return _reduce__27723.call(this, coll, f);
      case 3:
        return _reduce__27724.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27726 = o;
    if(cljs.core.truth_(and__3546__auto____27726)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____27726
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____27727 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____27727)) {
        return or__3548__auto____27727
      }else {
        var or__3548__auto____27728 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____27728)) {
          return or__3548__auto____27728
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
    var and__3546__auto____27729 = o;
    if(cljs.core.truth_(and__3546__auto____27729)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____27729
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____27730 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____27730)) {
        return or__3548__auto____27730
      }else {
        var or__3548__auto____27731 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____27731)) {
          return or__3548__auto____27731
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
    var and__3546__auto____27732 = o;
    if(cljs.core.truth_(and__3546__auto____27732)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____27732
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____27733 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____27733)) {
        return or__3548__auto____27733
      }else {
        var or__3548__auto____27734 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____27734)) {
          return or__3548__auto____27734
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
    var and__3546__auto____27735 = o;
    if(cljs.core.truth_(and__3546__auto____27735)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____27735
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____27736 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____27736)) {
        return or__3548__auto____27736
      }else {
        var or__3548__auto____27737 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____27737)) {
          return or__3548__auto____27737
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
    var and__3546__auto____27738 = d;
    if(cljs.core.truth_(and__3546__auto____27738)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____27738
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____27739 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____27739)) {
        return or__3548__auto____27739
      }else {
        var or__3548__auto____27740 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____27740)) {
          return or__3548__auto____27740
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
    var and__3546__auto____27741 = this$;
    if(cljs.core.truth_(and__3546__auto____27741)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____27741
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____27742 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____27742)) {
        return or__3548__auto____27742
      }else {
        var or__3548__auto____27743 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____27743)) {
          return or__3548__auto____27743
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27744 = this$;
    if(cljs.core.truth_(and__3546__auto____27744)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____27744
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____27745 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____27745)) {
        return or__3548__auto____27745
      }else {
        var or__3548__auto____27746 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____27746)) {
          return or__3548__auto____27746
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____27747 = this$;
    if(cljs.core.truth_(and__3546__auto____27747)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____27747
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____27748 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____27748)) {
        return or__3548__auto____27748
      }else {
        var or__3548__auto____27749 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____27749)) {
          return or__3548__auto____27749
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
  var G__27750 = null;
  var G__27750__27751 = function(o, k) {
    return null
  };
  var G__27750__27752 = function(o, k, not_found) {
    return not_found
  };
  G__27750 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27750__27751.call(this, o, k);
      case 3:
        return G__27750__27752.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27750
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
  var G__27754 = null;
  var G__27754__27755 = function(_, f) {
    return f.call(null)
  };
  var G__27754__27756 = function(_, f, start) {
    return start
  };
  G__27754 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__27754__27755.call(this, _, f);
      case 3:
        return G__27754__27756.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27754
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
  var G__27758 = null;
  var G__27758__27759 = function(_, n) {
    return null
  };
  var G__27758__27760 = function(_, n, not_found) {
    return not_found
  };
  G__27758 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27758__27759.call(this, _, n);
      case 3:
        return G__27758__27760.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27758
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
  var ci_reduce__27768 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__27762 = cljs.core._nth.call(null, cicoll, 0);
      var n__27763 = 1;
      while(true) {
        if(cljs.core.truth_(n__27763 < cljs.core._count.call(null, cicoll))) {
          var G__27772 = f.call(null, val__27762, cljs.core._nth.call(null, cicoll, n__27763));
          var G__27773 = n__27763 + 1;
          val__27762 = G__27772;
          n__27763 = G__27773;
          continue
        }else {
          return val__27762
        }
        break
      }
    }
  };
  var ci_reduce__27769 = function(cicoll, f, val) {
    var val__27764 = val;
    var n__27765 = 0;
    while(true) {
      if(cljs.core.truth_(n__27765 < cljs.core._count.call(null, cicoll))) {
        var G__27774 = f.call(null, val__27764, cljs.core._nth.call(null, cicoll, n__27765));
        var G__27775 = n__27765 + 1;
        val__27764 = G__27774;
        n__27765 = G__27775;
        continue
      }else {
        return val__27764
      }
      break
    }
  };
  var ci_reduce__27770 = function(cicoll, f, val, idx) {
    var val__27766 = val;
    var n__27767 = idx;
    while(true) {
      if(cljs.core.truth_(n__27767 < cljs.core._count.call(null, cicoll))) {
        var G__27776 = f.call(null, val__27766, cljs.core._nth.call(null, cicoll, n__27767));
        var G__27777 = n__27767 + 1;
        val__27766 = G__27776;
        n__27767 = G__27777;
        continue
      }else {
        return val__27766
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__27768.call(this, cicoll, f);
      case 3:
        return ci_reduce__27769.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__27770.call(this, cicoll, f, val, idx)
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
  var this__27778 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__27791 = null;
  var G__27791__27792 = function(_, f) {
    var this__27779 = this;
    return cljs.core.ci_reduce.call(null, this__27779.a, f, this__27779.a[this__27779.i], this__27779.i + 1)
  };
  var G__27791__27793 = function(_, f, start) {
    var this__27780 = this;
    return cljs.core.ci_reduce.call(null, this__27780.a, f, start, this__27780.i)
  };
  G__27791 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__27791__27792.call(this, _, f);
      case 3:
        return G__27791__27793.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27791
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__27781 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__27782 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__27795 = null;
  var G__27795__27796 = function(coll, n) {
    var this__27783 = this;
    var i__27784 = n + this__27783.i;
    if(cljs.core.truth_(i__27784 < this__27783.a.length)) {
      return this__27783.a[i__27784]
    }else {
      return null
    }
  };
  var G__27795__27797 = function(coll, n, not_found) {
    var this__27785 = this;
    var i__27786 = n + this__27785.i;
    if(cljs.core.truth_(i__27786 < this__27785.a.length)) {
      return this__27785.a[i__27786]
    }else {
      return not_found
    }
  };
  G__27795 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27795__27796.call(this, coll, n);
      case 3:
        return G__27795__27797.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27795
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__27787 = this;
  return this__27787.a.length - this__27787.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__27788 = this;
  return this__27788.a[this__27788.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__27789 = this;
  if(cljs.core.truth_(this__27789.i + 1 < this__27789.a.length)) {
    return new cljs.core.IndexedSeq(this__27789.a, this__27789.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__27790 = this;
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
  var G__27799 = null;
  var G__27799__27800 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__27799__27801 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__27799 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__27799__27800.call(this, array, f);
      case 3:
        return G__27799__27801.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27799
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__27803 = null;
  var G__27803__27804 = function(array, k) {
    return array[k]
  };
  var G__27803__27805 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__27803 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27803__27804.call(this, array, k);
      case 3:
        return G__27803__27805.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27803
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__27807 = null;
  var G__27807__27808 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__27807__27809 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__27807 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__27807__27808.call(this, array, n);
      case 3:
        return G__27807__27809.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27807
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
  var temp__3698__auto____27811 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____27811)) {
    var s__27812 = temp__3698__auto____27811;
    return cljs.core._first.call(null, s__27812)
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
      var G__27813 = cljs.core.next.call(null, s);
      s = G__27813;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__27814 = cljs.core.seq.call(null, x);
  var n__27815 = 0;
  while(true) {
    if(cljs.core.truth_(s__27814)) {
      var G__27816 = cljs.core.next.call(null, s__27814);
      var G__27817 = n__27815 + 1;
      s__27814 = G__27816;
      n__27815 = G__27817;
      continue
    }else {
      return n__27815
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
  var conj__27818 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__27819 = function() {
    var G__27821__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__27822 = conj.call(null, coll, x);
          var G__27823 = cljs.core.first.call(null, xs);
          var G__27824 = cljs.core.next.call(null, xs);
          coll = G__27822;
          x = G__27823;
          xs = G__27824;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__27821 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27821__delegate.call(this, coll, x, xs)
    };
    G__27821.cljs$lang$maxFixedArity = 2;
    G__27821.cljs$lang$applyTo = function(arglist__27825) {
      var coll = cljs.core.first(arglist__27825);
      var x = cljs.core.first(cljs.core.next(arglist__27825));
      var xs = cljs.core.rest(cljs.core.next(arglist__27825));
      return G__27821__delegate.call(this, coll, x, xs)
    };
    return G__27821
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__27818.call(this, coll, x);
      default:
        return conj__27819.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__27819.cljs$lang$applyTo;
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
  var nth__27826 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__27827 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__27826.call(this, coll, n);
      case 3:
        return nth__27827.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__27829 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__27830 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__27829.call(this, o, k);
      case 3:
        return get__27830.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__27833 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__27834 = function() {
    var G__27836__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__27832 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__27837 = ret__27832;
          var G__27838 = cljs.core.first.call(null, kvs);
          var G__27839 = cljs.core.second.call(null, kvs);
          var G__27840 = cljs.core.nnext.call(null, kvs);
          coll = G__27837;
          k = G__27838;
          v = G__27839;
          kvs = G__27840;
          continue
        }else {
          return ret__27832
        }
        break
      }
    };
    var G__27836 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__27836__delegate.call(this, coll, k, v, kvs)
    };
    G__27836.cljs$lang$maxFixedArity = 3;
    G__27836.cljs$lang$applyTo = function(arglist__27841) {
      var coll = cljs.core.first(arglist__27841);
      var k = cljs.core.first(cljs.core.next(arglist__27841));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__27841)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__27841)));
      return G__27836__delegate.call(this, coll, k, v, kvs)
    };
    return G__27836
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__27833.call(this, coll, k, v);
      default:
        return assoc__27834.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__27834.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__27843 = function(coll) {
    return coll
  };
  var dissoc__27844 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__27845 = function() {
    var G__27847__delegate = function(coll, k, ks) {
      while(true) {
        var ret__27842 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__27848 = ret__27842;
          var G__27849 = cljs.core.first.call(null, ks);
          var G__27850 = cljs.core.next.call(null, ks);
          coll = G__27848;
          k = G__27849;
          ks = G__27850;
          continue
        }else {
          return ret__27842
        }
        break
      }
    };
    var G__27847 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27847__delegate.call(this, coll, k, ks)
    };
    G__27847.cljs$lang$maxFixedArity = 2;
    G__27847.cljs$lang$applyTo = function(arglist__27851) {
      var coll = cljs.core.first(arglist__27851);
      var k = cljs.core.first(cljs.core.next(arglist__27851));
      var ks = cljs.core.rest(cljs.core.next(arglist__27851));
      return G__27847__delegate.call(this, coll, k, ks)
    };
    return G__27847
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__27843.call(this, coll);
      case 2:
        return dissoc__27844.call(this, coll, k);
      default:
        return dissoc__27845.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__27845.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__450__auto____27852 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____27853 = x__450__auto____27852;
      if(cljs.core.truth_(and__3546__auto____27853)) {
        var and__3546__auto____27854 = x__450__auto____27852.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____27854)) {
          return cljs.core.not.call(null, x__450__auto____27852.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____27854
        }
      }else {
        return and__3546__auto____27853
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____27852)
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
  var disj__27856 = function(coll) {
    return coll
  };
  var disj__27857 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__27858 = function() {
    var G__27860__delegate = function(coll, k, ks) {
      while(true) {
        var ret__27855 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__27861 = ret__27855;
          var G__27862 = cljs.core.first.call(null, ks);
          var G__27863 = cljs.core.next.call(null, ks);
          coll = G__27861;
          k = G__27862;
          ks = G__27863;
          continue
        }else {
          return ret__27855
        }
        break
      }
    };
    var G__27860 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27860__delegate.call(this, coll, k, ks)
    };
    G__27860.cljs$lang$maxFixedArity = 2;
    G__27860.cljs$lang$applyTo = function(arglist__27864) {
      var coll = cljs.core.first(arglist__27864);
      var k = cljs.core.first(cljs.core.next(arglist__27864));
      var ks = cljs.core.rest(cljs.core.next(arglist__27864));
      return G__27860__delegate.call(this, coll, k, ks)
    };
    return G__27860
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__27856.call(this, coll);
      case 2:
        return disj__27857.call(this, coll, k);
      default:
        return disj__27858.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__27858.cljs$lang$applyTo;
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
    var x__450__auto____27865 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____27866 = x__450__auto____27865;
      if(cljs.core.truth_(and__3546__auto____27866)) {
        var and__3546__auto____27867 = x__450__auto____27865.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____27867)) {
          return cljs.core.not.call(null, x__450__auto____27865.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____27867
        }
      }else {
        return and__3546__auto____27866
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__450__auto____27865)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____27868 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____27869 = x__450__auto____27868;
      if(cljs.core.truth_(and__3546__auto____27869)) {
        var and__3546__auto____27870 = x__450__auto____27868.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____27870)) {
          return cljs.core.not.call(null, x__450__auto____27868.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____27870
        }
      }else {
        return and__3546__auto____27869
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__450__auto____27868)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__450__auto____27871 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____27872 = x__450__auto____27871;
    if(cljs.core.truth_(and__3546__auto____27872)) {
      var and__3546__auto____27873 = x__450__auto____27871.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____27873)) {
        return cljs.core.not.call(null, x__450__auto____27871.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____27873
      }
    }else {
      return and__3546__auto____27872
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__450__auto____27871)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__450__auto____27874 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____27875 = x__450__auto____27874;
    if(cljs.core.truth_(and__3546__auto____27875)) {
      var and__3546__auto____27876 = x__450__auto____27874.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____27876)) {
        return cljs.core.not.call(null, x__450__auto____27874.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____27876
      }
    }else {
      return and__3546__auto____27875
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__450__auto____27874)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__450__auto____27877 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____27878 = x__450__auto____27877;
    if(cljs.core.truth_(and__3546__auto____27878)) {
      var and__3546__auto____27879 = x__450__auto____27877.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____27879)) {
        return cljs.core.not.call(null, x__450__auto____27877.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____27879
      }
    }else {
      return and__3546__auto____27878
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__450__auto____27877)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____27880 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____27881 = x__450__auto____27880;
      if(cljs.core.truth_(and__3546__auto____27881)) {
        var and__3546__auto____27882 = x__450__auto____27880.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____27882)) {
          return cljs.core.not.call(null, x__450__auto____27880.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____27882
        }
      }else {
        return and__3546__auto____27881
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__450__auto____27880)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__450__auto____27883 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____27884 = x__450__auto____27883;
    if(cljs.core.truth_(and__3546__auto____27884)) {
      var and__3546__auto____27885 = x__450__auto____27883.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____27885)) {
        return cljs.core.not.call(null, x__450__auto____27883.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____27885
      }
    }else {
      return and__3546__auto____27884
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__450__auto____27883)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__27886 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__27886.push(key)
  });
  return keys__27886
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
    var x__450__auto____27887 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____27888 = x__450__auto____27887;
      if(cljs.core.truth_(and__3546__auto____27888)) {
        var and__3546__auto____27889 = x__450__auto____27887.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____27889)) {
          return cljs.core.not.call(null, x__450__auto____27887.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____27889
        }
      }else {
        return and__3546__auto____27888
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__450__auto____27887)
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
  var and__3546__auto____27890 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____27890)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____27891 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____27891)) {
        return or__3548__auto____27891
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____27890
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____27892 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____27892)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____27892
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____27893 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____27893)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____27893
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____27894 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____27894)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____27894
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
    var and__3546__auto____27895 = coll;
    if(cljs.core.truth_(and__3546__auto____27895)) {
      var and__3546__auto____27896 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____27896)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____27896
      }
    }else {
      return and__3546__auto____27895
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___27901 = function(x) {
    return true
  };
  var distinct_QMARK___27902 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___27903 = function() {
    var G__27905__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__27897 = cljs.core.set([y, x]);
        var xs__27898 = more;
        while(true) {
          var x__27899 = cljs.core.first.call(null, xs__27898);
          var etc__27900 = cljs.core.next.call(null, xs__27898);
          if(cljs.core.truth_(xs__27898)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__27897, x__27899))) {
              return false
            }else {
              var G__27906 = cljs.core.conj.call(null, s__27897, x__27899);
              var G__27907 = etc__27900;
              s__27897 = G__27906;
              xs__27898 = G__27907;
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
    var G__27905 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27905__delegate.call(this, x, y, more)
    };
    G__27905.cljs$lang$maxFixedArity = 2;
    G__27905.cljs$lang$applyTo = function(arglist__27908) {
      var x = cljs.core.first(arglist__27908);
      var y = cljs.core.first(cljs.core.next(arglist__27908));
      var more = cljs.core.rest(cljs.core.next(arglist__27908));
      return G__27905__delegate.call(this, x, y, more)
    };
    return G__27905
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___27901.call(this, x);
      case 2:
        return distinct_QMARK___27902.call(this, x, y);
      default:
        return distinct_QMARK___27903.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___27903.cljs$lang$applyTo;
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
      var r__27909 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__27909))) {
        return r__27909
      }else {
        if(cljs.core.truth_(r__27909)) {
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
  var sort__27911 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__27912 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__27910 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__27910, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__27910)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__27911.call(this, comp);
      case 2:
        return sort__27912.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__27914 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__27915 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__27914.call(this, keyfn, comp);
      case 3:
        return sort_by__27915.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__27917 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__27918 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__27917.call(this, f, val);
      case 3:
        return reduce__27918.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__27924 = function(f, coll) {
    var temp__3695__auto____27920 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____27920)) {
      var s__27921 = temp__3695__auto____27920;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__27921), cljs.core.next.call(null, s__27921))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__27925 = function(f, val, coll) {
    var val__27922 = val;
    var coll__27923 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__27923)) {
        var G__27927 = f.call(null, val__27922, cljs.core.first.call(null, coll__27923));
        var G__27928 = cljs.core.next.call(null, coll__27923);
        val__27922 = G__27927;
        coll__27923 = G__27928;
        continue
      }else {
        return val__27922
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__27924.call(this, f, val);
      case 3:
        return seq_reduce__27925.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__27929 = null;
  var G__27929__27930 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__27929__27931 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__27929 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__27929__27930.call(this, coll, f);
      case 3:
        return G__27929__27931.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__27929
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___27933 = function() {
    return 0
  };
  var _PLUS___27934 = function(x) {
    return x
  };
  var _PLUS___27935 = function(x, y) {
    return x + y
  };
  var _PLUS___27936 = function() {
    var G__27938__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__27938 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27938__delegate.call(this, x, y, more)
    };
    G__27938.cljs$lang$maxFixedArity = 2;
    G__27938.cljs$lang$applyTo = function(arglist__27939) {
      var x = cljs.core.first(arglist__27939);
      var y = cljs.core.first(cljs.core.next(arglist__27939));
      var more = cljs.core.rest(cljs.core.next(arglist__27939));
      return G__27938__delegate.call(this, x, y, more)
    };
    return G__27938
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___27933.call(this);
      case 1:
        return _PLUS___27934.call(this, x);
      case 2:
        return _PLUS___27935.call(this, x, y);
      default:
        return _PLUS___27936.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___27936.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___27940 = function(x) {
    return-x
  };
  var ___27941 = function(x, y) {
    return x - y
  };
  var ___27942 = function() {
    var G__27944__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__27944 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27944__delegate.call(this, x, y, more)
    };
    G__27944.cljs$lang$maxFixedArity = 2;
    G__27944.cljs$lang$applyTo = function(arglist__27945) {
      var x = cljs.core.first(arglist__27945);
      var y = cljs.core.first(cljs.core.next(arglist__27945));
      var more = cljs.core.rest(cljs.core.next(arglist__27945));
      return G__27944__delegate.call(this, x, y, more)
    };
    return G__27944
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___27940.call(this, x);
      case 2:
        return ___27941.call(this, x, y);
      default:
        return ___27942.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___27942.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___27946 = function() {
    return 1
  };
  var _STAR___27947 = function(x) {
    return x
  };
  var _STAR___27948 = function(x, y) {
    return x * y
  };
  var _STAR___27949 = function() {
    var G__27951__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__27951 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27951__delegate.call(this, x, y, more)
    };
    G__27951.cljs$lang$maxFixedArity = 2;
    G__27951.cljs$lang$applyTo = function(arglist__27952) {
      var x = cljs.core.first(arglist__27952);
      var y = cljs.core.first(cljs.core.next(arglist__27952));
      var more = cljs.core.rest(cljs.core.next(arglist__27952));
      return G__27951__delegate.call(this, x, y, more)
    };
    return G__27951
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___27946.call(this);
      case 1:
        return _STAR___27947.call(this, x);
      case 2:
        return _STAR___27948.call(this, x, y);
      default:
        return _STAR___27949.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___27949.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___27953 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___27954 = function(x, y) {
    return x / y
  };
  var _SLASH___27955 = function() {
    var G__27957__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__27957 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27957__delegate.call(this, x, y, more)
    };
    G__27957.cljs$lang$maxFixedArity = 2;
    G__27957.cljs$lang$applyTo = function(arglist__27958) {
      var x = cljs.core.first(arglist__27958);
      var y = cljs.core.first(cljs.core.next(arglist__27958));
      var more = cljs.core.rest(cljs.core.next(arglist__27958));
      return G__27957__delegate.call(this, x, y, more)
    };
    return G__27957
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___27953.call(this, x);
      case 2:
        return _SLASH___27954.call(this, x, y);
      default:
        return _SLASH___27955.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___27955.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___27959 = function(x) {
    return true
  };
  var _LT___27960 = function(x, y) {
    return x < y
  };
  var _LT___27961 = function() {
    var G__27963__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__27964 = y;
            var G__27965 = cljs.core.first.call(null, more);
            var G__27966 = cljs.core.next.call(null, more);
            x = G__27964;
            y = G__27965;
            more = G__27966;
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
    var G__27963 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27963__delegate.call(this, x, y, more)
    };
    G__27963.cljs$lang$maxFixedArity = 2;
    G__27963.cljs$lang$applyTo = function(arglist__27967) {
      var x = cljs.core.first(arglist__27967);
      var y = cljs.core.first(cljs.core.next(arglist__27967));
      var more = cljs.core.rest(cljs.core.next(arglist__27967));
      return G__27963__delegate.call(this, x, y, more)
    };
    return G__27963
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___27959.call(this, x);
      case 2:
        return _LT___27960.call(this, x, y);
      default:
        return _LT___27961.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___27961.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___27968 = function(x) {
    return true
  };
  var _LT__EQ___27969 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___27970 = function() {
    var G__27972__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__27973 = y;
            var G__27974 = cljs.core.first.call(null, more);
            var G__27975 = cljs.core.next.call(null, more);
            x = G__27973;
            y = G__27974;
            more = G__27975;
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
    var G__27972 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27972__delegate.call(this, x, y, more)
    };
    G__27972.cljs$lang$maxFixedArity = 2;
    G__27972.cljs$lang$applyTo = function(arglist__27976) {
      var x = cljs.core.first(arglist__27976);
      var y = cljs.core.first(cljs.core.next(arglist__27976));
      var more = cljs.core.rest(cljs.core.next(arglist__27976));
      return G__27972__delegate.call(this, x, y, more)
    };
    return G__27972
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___27968.call(this, x);
      case 2:
        return _LT__EQ___27969.call(this, x, y);
      default:
        return _LT__EQ___27970.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___27970.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___27977 = function(x) {
    return true
  };
  var _GT___27978 = function(x, y) {
    return x > y
  };
  var _GT___27979 = function() {
    var G__27981__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__27982 = y;
            var G__27983 = cljs.core.first.call(null, more);
            var G__27984 = cljs.core.next.call(null, more);
            x = G__27982;
            y = G__27983;
            more = G__27984;
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
    var G__27981 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27981__delegate.call(this, x, y, more)
    };
    G__27981.cljs$lang$maxFixedArity = 2;
    G__27981.cljs$lang$applyTo = function(arglist__27985) {
      var x = cljs.core.first(arglist__27985);
      var y = cljs.core.first(cljs.core.next(arglist__27985));
      var more = cljs.core.rest(cljs.core.next(arglist__27985));
      return G__27981__delegate.call(this, x, y, more)
    };
    return G__27981
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___27977.call(this, x);
      case 2:
        return _GT___27978.call(this, x, y);
      default:
        return _GT___27979.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___27979.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___27986 = function(x) {
    return true
  };
  var _GT__EQ___27987 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___27988 = function() {
    var G__27990__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__27991 = y;
            var G__27992 = cljs.core.first.call(null, more);
            var G__27993 = cljs.core.next.call(null, more);
            x = G__27991;
            y = G__27992;
            more = G__27993;
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
    var G__27990 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27990__delegate.call(this, x, y, more)
    };
    G__27990.cljs$lang$maxFixedArity = 2;
    G__27990.cljs$lang$applyTo = function(arglist__27994) {
      var x = cljs.core.first(arglist__27994);
      var y = cljs.core.first(cljs.core.next(arglist__27994));
      var more = cljs.core.rest(cljs.core.next(arglist__27994));
      return G__27990__delegate.call(this, x, y, more)
    };
    return G__27990
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___27986.call(this, x);
      case 2:
        return _GT__EQ___27987.call(this, x, y);
      default:
        return _GT__EQ___27988.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___27988.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__27995 = function(x) {
    return x
  };
  var max__27996 = function(x, y) {
    return x > y ? x : y
  };
  var max__27997 = function() {
    var G__27999__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__27999 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__27999__delegate.call(this, x, y, more)
    };
    G__27999.cljs$lang$maxFixedArity = 2;
    G__27999.cljs$lang$applyTo = function(arglist__28000) {
      var x = cljs.core.first(arglist__28000);
      var y = cljs.core.first(cljs.core.next(arglist__28000));
      var more = cljs.core.rest(cljs.core.next(arglist__28000));
      return G__27999__delegate.call(this, x, y, more)
    };
    return G__27999
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__27995.call(this, x);
      case 2:
        return max__27996.call(this, x, y);
      default:
        return max__27997.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__27997.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__28001 = function(x) {
    return x
  };
  var min__28002 = function(x, y) {
    return x < y ? x : y
  };
  var min__28003 = function() {
    var G__28005__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__28005 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__28005__delegate.call(this, x, y, more)
    };
    G__28005.cljs$lang$maxFixedArity = 2;
    G__28005.cljs$lang$applyTo = function(arglist__28006) {
      var x = cljs.core.first(arglist__28006);
      var y = cljs.core.first(cljs.core.next(arglist__28006));
      var more = cljs.core.rest(cljs.core.next(arglist__28006));
      return G__28005__delegate.call(this, x, y, more)
    };
    return G__28005
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__28001.call(this, x);
      case 2:
        return min__28002.call(this, x, y);
      default:
        return min__28003.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__28003.cljs$lang$applyTo;
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
  var rem__28007 = n % d;
  return cljs.core.fix.call(null, (n - rem__28007) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__28008 = cljs.core.quot.call(null, n, d);
  return n - d * q__28008
};
cljs.core.rand = function() {
  var rand = null;
  var rand__28009 = function() {
    return Math.random.call(null)
  };
  var rand__28010 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__28009.call(this);
      case 1:
        return rand__28010.call(this, n)
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
  var _EQ__EQ___28012 = function(x) {
    return true
  };
  var _EQ__EQ___28013 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___28014 = function() {
    var G__28016__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__28017 = y;
            var G__28018 = cljs.core.first.call(null, more);
            var G__28019 = cljs.core.next.call(null, more);
            x = G__28017;
            y = G__28018;
            more = G__28019;
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
    var G__28016 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__28016__delegate.call(this, x, y, more)
    };
    G__28016.cljs$lang$maxFixedArity = 2;
    G__28016.cljs$lang$applyTo = function(arglist__28020) {
      var x = cljs.core.first(arglist__28020);
      var y = cljs.core.first(cljs.core.next(arglist__28020));
      var more = cljs.core.rest(cljs.core.next(arglist__28020));
      return G__28016__delegate.call(this, x, y, more)
    };
    return G__28016
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___28012.call(this, x);
      case 2:
        return _EQ__EQ___28013.call(this, x, y);
      default:
        return _EQ__EQ___28014.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___28014.cljs$lang$applyTo;
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
  var n__28021 = n;
  var xs__28022 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____28023 = xs__28022;
      if(cljs.core.truth_(and__3546__auto____28023)) {
        return n__28021 > 0
      }else {
        return and__3546__auto____28023
      }
    }())) {
      var G__28024 = n__28021 - 1;
      var G__28025 = cljs.core.next.call(null, xs__28022);
      n__28021 = G__28024;
      xs__28022 = G__28025;
      continue
    }else {
      return xs__28022
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__28030 = null;
  var G__28030__28031 = function(coll, n) {
    var temp__3695__auto____28026 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____28026)) {
      var xs__28027 = temp__3695__auto____28026;
      return cljs.core.first.call(null, xs__28027)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__28030__28032 = function(coll, n, not_found) {
    var temp__3695__auto____28028 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____28028)) {
      var xs__28029 = temp__3695__auto____28028;
      return cljs.core.first.call(null, xs__28029)
    }else {
      return not_found
    }
  };
  G__28030 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28030__28031.call(this, coll, n);
      case 3:
        return G__28030__28032.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28030
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___28034 = function() {
    return""
  };
  var str_STAR___28035 = function(x) {
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
  var str_STAR___28036 = function() {
    var G__28038__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__28039 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__28040 = cljs.core.next.call(null, more);
            sb = G__28039;
            more = G__28040;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__28038 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__28038__delegate.call(this, x, ys)
    };
    G__28038.cljs$lang$maxFixedArity = 1;
    G__28038.cljs$lang$applyTo = function(arglist__28041) {
      var x = cljs.core.first(arglist__28041);
      var ys = cljs.core.rest(arglist__28041);
      return G__28038__delegate.call(this, x, ys)
    };
    return G__28038
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___28034.call(this);
      case 1:
        return str_STAR___28035.call(this, x);
      default:
        return str_STAR___28036.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___28036.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__28042 = function() {
    return""
  };
  var str__28043 = function(x) {
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
  var str__28044 = function() {
    var G__28046__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__28046 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__28046__delegate.call(this, x, ys)
    };
    G__28046.cljs$lang$maxFixedArity = 1;
    G__28046.cljs$lang$applyTo = function(arglist__28047) {
      var x = cljs.core.first(arglist__28047);
      var ys = cljs.core.rest(arglist__28047);
      return G__28046__delegate.call(this, x, ys)
    };
    return G__28046
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__28042.call(this);
      case 1:
        return str__28043.call(this, x);
      default:
        return str__28044.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__28044.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__28048 = function(s, start) {
    return s.substring(start)
  };
  var subs__28049 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__28048.call(this, s, start);
      case 3:
        return subs__28049.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__28051 = function(name) {
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
  var symbol__28052 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__28051.call(this, ns);
      case 2:
        return symbol__28052.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__28054 = function(name) {
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
  var keyword__28055 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__28054.call(this, ns);
      case 2:
        return keyword__28055.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__28057 = cljs.core.seq.call(null, x);
    var ys__28058 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__28057 === null)) {
        return ys__28058 === null
      }else {
        if(cljs.core.truth_(ys__28058 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__28057), cljs.core.first.call(null, ys__28058)))) {
            var G__28059 = cljs.core.next.call(null, xs__28057);
            var G__28060 = cljs.core.next.call(null, ys__28058);
            xs__28057 = G__28059;
            ys__28058 = G__28060;
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
  return cljs.core.reduce.call(null, function(p1__28061_SHARP_, p2__28062_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__28061_SHARP_, cljs.core.hash.call(null, p2__28062_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__28063__28064 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__28063__28064)) {
    var G__28066__28068 = cljs.core.first.call(null, G__28063__28064);
    var vec__28067__28069 = G__28066__28068;
    var key_name__28070 = cljs.core.nth.call(null, vec__28067__28069, 0, null);
    var f__28071 = cljs.core.nth.call(null, vec__28067__28069, 1, null);
    var G__28063__28072 = G__28063__28064;
    var G__28066__28073 = G__28066__28068;
    var G__28063__28074 = G__28063__28072;
    while(true) {
      var vec__28075__28076 = G__28066__28073;
      var key_name__28077 = cljs.core.nth.call(null, vec__28075__28076, 0, null);
      var f__28078 = cljs.core.nth.call(null, vec__28075__28076, 1, null);
      var G__28063__28079 = G__28063__28074;
      var str_name__28080 = cljs.core.name.call(null, key_name__28077);
      obj[str_name__28080] = f__28078;
      var temp__3698__auto____28081 = cljs.core.next.call(null, G__28063__28079);
      if(cljs.core.truth_(temp__3698__auto____28081)) {
        var G__28063__28082 = temp__3698__auto____28081;
        var G__28083 = cljs.core.first.call(null, G__28063__28082);
        var G__28084 = G__28063__28082;
        G__28066__28073 = G__28083;
        G__28063__28074 = G__28084;
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
  var this__28085 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28086 = this;
  return new cljs.core.List(this__28086.meta, o, coll, this__28086.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__28087 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__28088 = this;
  return this__28088.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__28089 = this;
  return this__28089.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__28090 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__28091 = this;
  return this__28091.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__28092 = this;
  return this__28092.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28093 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28094 = this;
  return new cljs.core.List(meta, this__28094.first, this__28094.rest, this__28094.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28095 = this;
  return this__28095.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28096 = this;
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
  var this__28097 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28098 = this;
  return new cljs.core.List(this__28098.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__28099 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__28100 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__28101 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__28102 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__28103 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__28104 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28105 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28106 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28107 = this;
  return this__28107.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28108 = this;
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
  list.cljs$lang$applyTo = function(arglist__28109) {
    var items = cljs.core.seq(arglist__28109);
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
  var this__28110 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__28111 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28112 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28113 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__28113.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28114 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__28115 = this;
  return this__28115.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__28116 = this;
  if(cljs.core.truth_(this__28116.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__28116.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28117 = this;
  return this__28117.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28118 = this;
  return new cljs.core.Cons(meta, this__28118.first, this__28118.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__28119 = null;
  var G__28119__28120 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__28119__28121 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__28119 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__28119__28120.call(this, string, f);
      case 3:
        return G__28119__28121.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28119
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__28123 = null;
  var G__28123__28124 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__28123__28125 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__28123 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28123__28124.call(this, string, k);
      case 3:
        return G__28123__28125.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28123
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__28127 = null;
  var G__28127__28128 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__28127__28129 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__28127 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28127__28128.call(this, string, n);
      case 3:
        return G__28127__28129.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28127
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
  var G__28137 = null;
  var G__28137__28138 = function(tsym28131, coll) {
    var tsym28131__28133 = this;
    var this$__28134 = tsym28131__28133;
    return cljs.core.get.call(null, coll, this$__28134.toString())
  };
  var G__28137__28139 = function(tsym28132, coll, not_found) {
    var tsym28132__28135 = this;
    var this$__28136 = tsym28132__28135;
    return cljs.core.get.call(null, coll, this$__28136.toString(), not_found)
  };
  G__28137 = function(tsym28132, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28137__28138.call(this, tsym28132, coll);
      case 3:
        return G__28137__28139.call(this, tsym28132, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28137
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__28141 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__28141
  }else {
    lazy_seq.x = x__28141.call(null);
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
  var this__28142 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__28143 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28144 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28145 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__28145.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28146 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__28147 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__28148 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28149 = this;
  return this__28149.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28150 = this;
  return new cljs.core.LazySeq(meta, this__28150.realized, this__28150.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__28151 = cljs.core.array.call(null);
  var s__28152 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__28152))) {
      ary__28151.push(cljs.core.first.call(null, s__28152));
      var G__28153 = cljs.core.next.call(null, s__28152);
      s__28152 = G__28153;
      continue
    }else {
      return ary__28151
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__28154 = s;
  var i__28155 = n;
  var sum__28156 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____28157 = i__28155 > 0;
      if(cljs.core.truth_(and__3546__auto____28157)) {
        return cljs.core.seq.call(null, s__28154)
      }else {
        return and__3546__auto____28157
      }
    }())) {
      var G__28158 = cljs.core.next.call(null, s__28154);
      var G__28159 = i__28155 - 1;
      var G__28160 = sum__28156 + 1;
      s__28154 = G__28158;
      i__28155 = G__28159;
      sum__28156 = G__28160;
      continue
    }else {
      return sum__28156
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
  var concat__28164 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__28165 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__28166 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__28161 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__28161)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__28161), concat.call(null, cljs.core.rest.call(null, s__28161), y))
      }else {
        return y
      }
    })
  };
  var concat__28167 = function() {
    var G__28169__delegate = function(x, y, zs) {
      var cat__28163 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__28162 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__28162)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__28162), cat.call(null, cljs.core.rest.call(null, xys__28162), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__28163.call(null, concat.call(null, x, y), zs)
    };
    var G__28169 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__28169__delegate.call(this, x, y, zs)
    };
    G__28169.cljs$lang$maxFixedArity = 2;
    G__28169.cljs$lang$applyTo = function(arglist__28170) {
      var x = cljs.core.first(arglist__28170);
      var y = cljs.core.first(cljs.core.next(arglist__28170));
      var zs = cljs.core.rest(cljs.core.next(arglist__28170));
      return G__28169__delegate.call(this, x, y, zs)
    };
    return G__28169
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__28164.call(this);
      case 1:
        return concat__28165.call(this, x);
      case 2:
        return concat__28166.call(this, x, y);
      default:
        return concat__28167.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__28167.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___28171 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___28172 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___28173 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___28174 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___28175 = function() {
    var G__28177__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__28177 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__28177__delegate.call(this, a, b, c, d, more)
    };
    G__28177.cljs$lang$maxFixedArity = 4;
    G__28177.cljs$lang$applyTo = function(arglist__28178) {
      var a = cljs.core.first(arglist__28178);
      var b = cljs.core.first(cljs.core.next(arglist__28178));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28178)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28178))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28178))));
      return G__28177__delegate.call(this, a, b, c, d, more)
    };
    return G__28177
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___28171.call(this, a);
      case 2:
        return list_STAR___28172.call(this, a, b);
      case 3:
        return list_STAR___28173.call(this, a, b, c);
      case 4:
        return list_STAR___28174.call(this, a, b, c, d);
      default:
        return list_STAR___28175.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___28175.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__28188 = function(f, args) {
    var fixed_arity__28179 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__28179 + 1) <= fixed_arity__28179)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__28189 = function(f, x, args) {
    var arglist__28180 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__28181 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__28180, fixed_arity__28181) <= fixed_arity__28181)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__28180))
      }else {
        return f.cljs$lang$applyTo(arglist__28180)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__28180))
    }
  };
  var apply__28190 = function(f, x, y, args) {
    var arglist__28182 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__28183 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__28182, fixed_arity__28183) <= fixed_arity__28183)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__28182))
      }else {
        return f.cljs$lang$applyTo(arglist__28182)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__28182))
    }
  };
  var apply__28191 = function(f, x, y, z, args) {
    var arglist__28184 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__28185 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__28184, fixed_arity__28185) <= fixed_arity__28185)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__28184))
      }else {
        return f.cljs$lang$applyTo(arglist__28184)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__28184))
    }
  };
  var apply__28192 = function() {
    var G__28194__delegate = function(f, a, b, c, d, args) {
      var arglist__28186 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__28187 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__28186, fixed_arity__28187) <= fixed_arity__28187)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__28186))
        }else {
          return f.cljs$lang$applyTo(arglist__28186)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__28186))
      }
    };
    var G__28194 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__28194__delegate.call(this, f, a, b, c, d, args)
    };
    G__28194.cljs$lang$maxFixedArity = 5;
    G__28194.cljs$lang$applyTo = function(arglist__28195) {
      var f = cljs.core.first(arglist__28195);
      var a = cljs.core.first(cljs.core.next(arglist__28195));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28195)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28195))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28195)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28195)))));
      return G__28194__delegate.call(this, f, a, b, c, d, args)
    };
    return G__28194
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__28188.call(this, f, a);
      case 3:
        return apply__28189.call(this, f, a, b);
      case 4:
        return apply__28190.call(this, f, a, b, c);
      case 5:
        return apply__28191.call(this, f, a, b, c, d);
      default:
        return apply__28192.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__28192.cljs$lang$applyTo;
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
  vary_meta.cljs$lang$applyTo = function(arglist__28196) {
    var obj = cljs.core.first(arglist__28196);
    var f = cljs.core.first(cljs.core.next(arglist__28196));
    var args = cljs.core.rest(cljs.core.next(arglist__28196));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___28197 = function(x) {
    return false
  };
  var not_EQ___28198 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___28199 = function() {
    var G__28201__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__28201 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__28201__delegate.call(this, x, y, more)
    };
    G__28201.cljs$lang$maxFixedArity = 2;
    G__28201.cljs$lang$applyTo = function(arglist__28202) {
      var x = cljs.core.first(arglist__28202);
      var y = cljs.core.first(cljs.core.next(arglist__28202));
      var more = cljs.core.rest(cljs.core.next(arglist__28202));
      return G__28201__delegate.call(this, x, y, more)
    };
    return G__28201
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___28197.call(this, x);
      case 2:
        return not_EQ___28198.call(this, x, y);
      default:
        return not_EQ___28199.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___28199.cljs$lang$applyTo;
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
        var G__28203 = pred;
        var G__28204 = cljs.core.next.call(null, coll);
        pred = G__28203;
        coll = G__28204;
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
      var or__3548__auto____28205 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____28205)) {
        return or__3548__auto____28205
      }else {
        var G__28206 = pred;
        var G__28207 = cljs.core.next.call(null, coll);
        pred = G__28206;
        coll = G__28207;
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
    var G__28208 = null;
    var G__28208__28209 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__28208__28210 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__28208__28211 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__28208__28212 = function() {
      var G__28214__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__28214 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__28214__delegate.call(this, x, y, zs)
      };
      G__28214.cljs$lang$maxFixedArity = 2;
      G__28214.cljs$lang$applyTo = function(arglist__28215) {
        var x = cljs.core.first(arglist__28215);
        var y = cljs.core.first(cljs.core.next(arglist__28215));
        var zs = cljs.core.rest(cljs.core.next(arglist__28215));
        return G__28214__delegate.call(this, x, y, zs)
      };
      return G__28214
    }();
    G__28208 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__28208__28209.call(this);
        case 1:
          return G__28208__28210.call(this, x);
        case 2:
          return G__28208__28211.call(this, x, y);
        default:
          return G__28208__28212.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__28208.cljs$lang$maxFixedArity = 2;
    G__28208.cljs$lang$applyTo = G__28208__28212.cljs$lang$applyTo;
    return G__28208
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__28216__delegate = function(args) {
      return x
    };
    var G__28216 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__28216__delegate.call(this, args)
    };
    G__28216.cljs$lang$maxFixedArity = 0;
    G__28216.cljs$lang$applyTo = function(arglist__28217) {
      var args = cljs.core.seq(arglist__28217);
      return G__28216__delegate.call(this, args)
    };
    return G__28216
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__28221 = function() {
    return cljs.core.identity
  };
  var comp__28222 = function(f) {
    return f
  };
  var comp__28223 = function(f, g) {
    return function() {
      var G__28227 = null;
      var G__28227__28228 = function() {
        return f.call(null, g.call(null))
      };
      var G__28227__28229 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__28227__28230 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__28227__28231 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__28227__28232 = function() {
        var G__28234__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__28234 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28234__delegate.call(this, x, y, z, args)
        };
        G__28234.cljs$lang$maxFixedArity = 3;
        G__28234.cljs$lang$applyTo = function(arglist__28235) {
          var x = cljs.core.first(arglist__28235);
          var y = cljs.core.first(cljs.core.next(arglist__28235));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28235)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28235)));
          return G__28234__delegate.call(this, x, y, z, args)
        };
        return G__28234
      }();
      G__28227 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__28227__28228.call(this);
          case 1:
            return G__28227__28229.call(this, x);
          case 2:
            return G__28227__28230.call(this, x, y);
          case 3:
            return G__28227__28231.call(this, x, y, z);
          default:
            return G__28227__28232.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__28227.cljs$lang$maxFixedArity = 3;
      G__28227.cljs$lang$applyTo = G__28227__28232.cljs$lang$applyTo;
      return G__28227
    }()
  };
  var comp__28224 = function(f, g, h) {
    return function() {
      var G__28236 = null;
      var G__28236__28237 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__28236__28238 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__28236__28239 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__28236__28240 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__28236__28241 = function() {
        var G__28243__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__28243 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28243__delegate.call(this, x, y, z, args)
        };
        G__28243.cljs$lang$maxFixedArity = 3;
        G__28243.cljs$lang$applyTo = function(arglist__28244) {
          var x = cljs.core.first(arglist__28244);
          var y = cljs.core.first(cljs.core.next(arglist__28244));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28244)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28244)));
          return G__28243__delegate.call(this, x, y, z, args)
        };
        return G__28243
      }();
      G__28236 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__28236__28237.call(this);
          case 1:
            return G__28236__28238.call(this, x);
          case 2:
            return G__28236__28239.call(this, x, y);
          case 3:
            return G__28236__28240.call(this, x, y, z);
          default:
            return G__28236__28241.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__28236.cljs$lang$maxFixedArity = 3;
      G__28236.cljs$lang$applyTo = G__28236__28241.cljs$lang$applyTo;
      return G__28236
    }()
  };
  var comp__28225 = function() {
    var G__28245__delegate = function(f1, f2, f3, fs) {
      var fs__28218 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__28246__delegate = function(args) {
          var ret__28219 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__28218), args);
          var fs__28220 = cljs.core.next.call(null, fs__28218);
          while(true) {
            if(cljs.core.truth_(fs__28220)) {
              var G__28247 = cljs.core.first.call(null, fs__28220).call(null, ret__28219);
              var G__28248 = cljs.core.next.call(null, fs__28220);
              ret__28219 = G__28247;
              fs__28220 = G__28248;
              continue
            }else {
              return ret__28219
            }
            break
          }
        };
        var G__28246 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__28246__delegate.call(this, args)
        };
        G__28246.cljs$lang$maxFixedArity = 0;
        G__28246.cljs$lang$applyTo = function(arglist__28249) {
          var args = cljs.core.seq(arglist__28249);
          return G__28246__delegate.call(this, args)
        };
        return G__28246
      }()
    };
    var G__28245 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__28245__delegate.call(this, f1, f2, f3, fs)
    };
    G__28245.cljs$lang$maxFixedArity = 3;
    G__28245.cljs$lang$applyTo = function(arglist__28250) {
      var f1 = cljs.core.first(arglist__28250);
      var f2 = cljs.core.first(cljs.core.next(arglist__28250));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28250)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28250)));
      return G__28245__delegate.call(this, f1, f2, f3, fs)
    };
    return G__28245
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__28221.call(this);
      case 1:
        return comp__28222.call(this, f1);
      case 2:
        return comp__28223.call(this, f1, f2);
      case 3:
        return comp__28224.call(this, f1, f2, f3);
      default:
        return comp__28225.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__28225.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__28251 = function(f, arg1) {
    return function() {
      var G__28256__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__28256 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__28256__delegate.call(this, args)
      };
      G__28256.cljs$lang$maxFixedArity = 0;
      G__28256.cljs$lang$applyTo = function(arglist__28257) {
        var args = cljs.core.seq(arglist__28257);
        return G__28256__delegate.call(this, args)
      };
      return G__28256
    }()
  };
  var partial__28252 = function(f, arg1, arg2) {
    return function() {
      var G__28258__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__28258 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__28258__delegate.call(this, args)
      };
      G__28258.cljs$lang$maxFixedArity = 0;
      G__28258.cljs$lang$applyTo = function(arglist__28259) {
        var args = cljs.core.seq(arglist__28259);
        return G__28258__delegate.call(this, args)
      };
      return G__28258
    }()
  };
  var partial__28253 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__28260__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__28260 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__28260__delegate.call(this, args)
      };
      G__28260.cljs$lang$maxFixedArity = 0;
      G__28260.cljs$lang$applyTo = function(arglist__28261) {
        var args = cljs.core.seq(arglist__28261);
        return G__28260__delegate.call(this, args)
      };
      return G__28260
    }()
  };
  var partial__28254 = function() {
    var G__28262__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__28263__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__28263 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__28263__delegate.call(this, args)
        };
        G__28263.cljs$lang$maxFixedArity = 0;
        G__28263.cljs$lang$applyTo = function(arglist__28264) {
          var args = cljs.core.seq(arglist__28264);
          return G__28263__delegate.call(this, args)
        };
        return G__28263
      }()
    };
    var G__28262 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__28262__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__28262.cljs$lang$maxFixedArity = 4;
    G__28262.cljs$lang$applyTo = function(arglist__28265) {
      var f = cljs.core.first(arglist__28265);
      var arg1 = cljs.core.first(cljs.core.next(arglist__28265));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28265)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28265))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28265))));
      return G__28262__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__28262
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__28251.call(this, f, arg1);
      case 3:
        return partial__28252.call(this, f, arg1, arg2);
      case 4:
        return partial__28253.call(this, f, arg1, arg2, arg3);
      default:
        return partial__28254.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__28254.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__28266 = function(f, x) {
    return function() {
      var G__28270 = null;
      var G__28270__28271 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__28270__28272 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__28270__28273 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__28270__28274 = function() {
        var G__28276__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__28276 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28276__delegate.call(this, a, b, c, ds)
        };
        G__28276.cljs$lang$maxFixedArity = 3;
        G__28276.cljs$lang$applyTo = function(arglist__28277) {
          var a = cljs.core.first(arglist__28277);
          var b = cljs.core.first(cljs.core.next(arglist__28277));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28277)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28277)));
          return G__28276__delegate.call(this, a, b, c, ds)
        };
        return G__28276
      }();
      G__28270 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__28270__28271.call(this, a);
          case 2:
            return G__28270__28272.call(this, a, b);
          case 3:
            return G__28270__28273.call(this, a, b, c);
          default:
            return G__28270__28274.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__28270.cljs$lang$maxFixedArity = 3;
      G__28270.cljs$lang$applyTo = G__28270__28274.cljs$lang$applyTo;
      return G__28270
    }()
  };
  var fnil__28267 = function(f, x, y) {
    return function() {
      var G__28278 = null;
      var G__28278__28279 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__28278__28280 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__28278__28281 = function() {
        var G__28283__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__28283 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28283__delegate.call(this, a, b, c, ds)
        };
        G__28283.cljs$lang$maxFixedArity = 3;
        G__28283.cljs$lang$applyTo = function(arglist__28284) {
          var a = cljs.core.first(arglist__28284);
          var b = cljs.core.first(cljs.core.next(arglist__28284));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28284)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28284)));
          return G__28283__delegate.call(this, a, b, c, ds)
        };
        return G__28283
      }();
      G__28278 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__28278__28279.call(this, a, b);
          case 3:
            return G__28278__28280.call(this, a, b, c);
          default:
            return G__28278__28281.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__28278.cljs$lang$maxFixedArity = 3;
      G__28278.cljs$lang$applyTo = G__28278__28281.cljs$lang$applyTo;
      return G__28278
    }()
  };
  var fnil__28268 = function(f, x, y, z) {
    return function() {
      var G__28285 = null;
      var G__28285__28286 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__28285__28287 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__28285__28288 = function() {
        var G__28290__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__28290 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28290__delegate.call(this, a, b, c, ds)
        };
        G__28290.cljs$lang$maxFixedArity = 3;
        G__28290.cljs$lang$applyTo = function(arglist__28291) {
          var a = cljs.core.first(arglist__28291);
          var b = cljs.core.first(cljs.core.next(arglist__28291));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28291)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28291)));
          return G__28290__delegate.call(this, a, b, c, ds)
        };
        return G__28290
      }();
      G__28285 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__28285__28286.call(this, a, b);
          case 3:
            return G__28285__28287.call(this, a, b, c);
          default:
            return G__28285__28288.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__28285.cljs$lang$maxFixedArity = 3;
      G__28285.cljs$lang$applyTo = G__28285__28288.cljs$lang$applyTo;
      return G__28285
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__28266.call(this, f, x);
      case 3:
        return fnil__28267.call(this, f, x, y);
      case 4:
        return fnil__28268.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__28294 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____28292 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____28292)) {
        var s__28293 = temp__3698__auto____28292;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__28293)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__28293)))
      }else {
        return null
      }
    })
  };
  return mapi__28294.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____28295 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____28295)) {
      var s__28296 = temp__3698__auto____28295;
      var x__28297 = f.call(null, cljs.core.first.call(null, s__28296));
      if(cljs.core.truth_(x__28297 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__28296))
      }else {
        return cljs.core.cons.call(null, x__28297, keep.call(null, f, cljs.core.rest.call(null, s__28296)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__28307 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____28304 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____28304)) {
        var s__28305 = temp__3698__auto____28304;
        var x__28306 = f.call(null, idx, cljs.core.first.call(null, s__28305));
        if(cljs.core.truth_(x__28306 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__28305))
        }else {
          return cljs.core.cons.call(null, x__28306, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__28305)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__28307.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__28352 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__28357 = function() {
        return true
      };
      var ep1__28358 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__28359 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____28314 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____28314)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____28314
          }
        }())
      };
      var ep1__28360 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____28315 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____28315)) {
            var and__3546__auto____28316 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____28316)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____28316
            }
          }else {
            return and__3546__auto____28315
          }
        }())
      };
      var ep1__28361 = function() {
        var G__28363__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____28317 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____28317)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____28317
            }
          }())
        };
        var G__28363 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28363__delegate.call(this, x, y, z, args)
        };
        G__28363.cljs$lang$maxFixedArity = 3;
        G__28363.cljs$lang$applyTo = function(arglist__28364) {
          var x = cljs.core.first(arglist__28364);
          var y = cljs.core.first(cljs.core.next(arglist__28364));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28364)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28364)));
          return G__28363__delegate.call(this, x, y, z, args)
        };
        return G__28363
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__28357.call(this);
          case 1:
            return ep1__28358.call(this, x);
          case 2:
            return ep1__28359.call(this, x, y);
          case 3:
            return ep1__28360.call(this, x, y, z);
          default:
            return ep1__28361.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__28361.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__28353 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__28365 = function() {
        return true
      };
      var ep2__28366 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____28318 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____28318)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____28318
          }
        }())
      };
      var ep2__28367 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____28319 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____28319)) {
            var and__3546__auto____28320 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____28320)) {
              var and__3546__auto____28321 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____28321)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____28321
              }
            }else {
              return and__3546__auto____28320
            }
          }else {
            return and__3546__auto____28319
          }
        }())
      };
      var ep2__28368 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____28322 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____28322)) {
            var and__3546__auto____28323 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____28323)) {
              var and__3546__auto____28324 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____28324)) {
                var and__3546__auto____28325 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____28325)) {
                  var and__3546__auto____28326 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____28326)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____28326
                  }
                }else {
                  return and__3546__auto____28325
                }
              }else {
                return and__3546__auto____28324
              }
            }else {
              return and__3546__auto____28323
            }
          }else {
            return and__3546__auto____28322
          }
        }())
      };
      var ep2__28369 = function() {
        var G__28371__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____28327 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____28327)) {
              return cljs.core.every_QMARK_.call(null, function(p1__28298_SHARP_) {
                var and__3546__auto____28328 = p1.call(null, p1__28298_SHARP_);
                if(cljs.core.truth_(and__3546__auto____28328)) {
                  return p2.call(null, p1__28298_SHARP_)
                }else {
                  return and__3546__auto____28328
                }
              }, args)
            }else {
              return and__3546__auto____28327
            }
          }())
        };
        var G__28371 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28371__delegate.call(this, x, y, z, args)
        };
        G__28371.cljs$lang$maxFixedArity = 3;
        G__28371.cljs$lang$applyTo = function(arglist__28372) {
          var x = cljs.core.first(arglist__28372);
          var y = cljs.core.first(cljs.core.next(arglist__28372));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28372)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28372)));
          return G__28371__delegate.call(this, x, y, z, args)
        };
        return G__28371
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__28365.call(this);
          case 1:
            return ep2__28366.call(this, x);
          case 2:
            return ep2__28367.call(this, x, y);
          case 3:
            return ep2__28368.call(this, x, y, z);
          default:
            return ep2__28369.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__28369.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__28354 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__28373 = function() {
        return true
      };
      var ep3__28374 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____28329 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____28329)) {
            var and__3546__auto____28330 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____28330)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____28330
            }
          }else {
            return and__3546__auto____28329
          }
        }())
      };
      var ep3__28375 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____28331 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____28331)) {
            var and__3546__auto____28332 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____28332)) {
              var and__3546__auto____28333 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____28333)) {
                var and__3546__auto____28334 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____28334)) {
                  var and__3546__auto____28335 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____28335)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____28335
                  }
                }else {
                  return and__3546__auto____28334
                }
              }else {
                return and__3546__auto____28333
              }
            }else {
              return and__3546__auto____28332
            }
          }else {
            return and__3546__auto____28331
          }
        }())
      };
      var ep3__28376 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____28336 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____28336)) {
            var and__3546__auto____28337 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____28337)) {
              var and__3546__auto____28338 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____28338)) {
                var and__3546__auto____28339 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____28339)) {
                  var and__3546__auto____28340 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____28340)) {
                    var and__3546__auto____28341 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____28341)) {
                      var and__3546__auto____28342 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____28342)) {
                        var and__3546__auto____28343 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____28343)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____28343
                        }
                      }else {
                        return and__3546__auto____28342
                      }
                    }else {
                      return and__3546__auto____28341
                    }
                  }else {
                    return and__3546__auto____28340
                  }
                }else {
                  return and__3546__auto____28339
                }
              }else {
                return and__3546__auto____28338
              }
            }else {
              return and__3546__auto____28337
            }
          }else {
            return and__3546__auto____28336
          }
        }())
      };
      var ep3__28377 = function() {
        var G__28379__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____28344 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____28344)) {
              return cljs.core.every_QMARK_.call(null, function(p1__28299_SHARP_) {
                var and__3546__auto____28345 = p1.call(null, p1__28299_SHARP_);
                if(cljs.core.truth_(and__3546__auto____28345)) {
                  var and__3546__auto____28346 = p2.call(null, p1__28299_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____28346)) {
                    return p3.call(null, p1__28299_SHARP_)
                  }else {
                    return and__3546__auto____28346
                  }
                }else {
                  return and__3546__auto____28345
                }
              }, args)
            }else {
              return and__3546__auto____28344
            }
          }())
        };
        var G__28379 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28379__delegate.call(this, x, y, z, args)
        };
        G__28379.cljs$lang$maxFixedArity = 3;
        G__28379.cljs$lang$applyTo = function(arglist__28380) {
          var x = cljs.core.first(arglist__28380);
          var y = cljs.core.first(cljs.core.next(arglist__28380));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28380)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28380)));
          return G__28379__delegate.call(this, x, y, z, args)
        };
        return G__28379
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__28373.call(this);
          case 1:
            return ep3__28374.call(this, x);
          case 2:
            return ep3__28375.call(this, x, y);
          case 3:
            return ep3__28376.call(this, x, y, z);
          default:
            return ep3__28377.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__28377.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__28355 = function() {
    var G__28381__delegate = function(p1, p2, p3, ps) {
      var ps__28347 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__28382 = function() {
          return true
        };
        var epn__28383 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__28300_SHARP_) {
            return p1__28300_SHARP_.call(null, x)
          }, ps__28347)
        };
        var epn__28384 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__28301_SHARP_) {
            var and__3546__auto____28348 = p1__28301_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____28348)) {
              return p1__28301_SHARP_.call(null, y)
            }else {
              return and__3546__auto____28348
            }
          }, ps__28347)
        };
        var epn__28385 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__28302_SHARP_) {
            var and__3546__auto____28349 = p1__28302_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____28349)) {
              var and__3546__auto____28350 = p1__28302_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____28350)) {
                return p1__28302_SHARP_.call(null, z)
              }else {
                return and__3546__auto____28350
              }
            }else {
              return and__3546__auto____28349
            }
          }, ps__28347)
        };
        var epn__28386 = function() {
          var G__28388__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____28351 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____28351)) {
                return cljs.core.every_QMARK_.call(null, function(p1__28303_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__28303_SHARP_, args)
                }, ps__28347)
              }else {
                return and__3546__auto____28351
              }
            }())
          };
          var G__28388 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__28388__delegate.call(this, x, y, z, args)
          };
          G__28388.cljs$lang$maxFixedArity = 3;
          G__28388.cljs$lang$applyTo = function(arglist__28389) {
            var x = cljs.core.first(arglist__28389);
            var y = cljs.core.first(cljs.core.next(arglist__28389));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28389)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28389)));
            return G__28388__delegate.call(this, x, y, z, args)
          };
          return G__28388
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__28382.call(this);
            case 1:
              return epn__28383.call(this, x);
            case 2:
              return epn__28384.call(this, x, y);
            case 3:
              return epn__28385.call(this, x, y, z);
            default:
              return epn__28386.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__28386.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__28381 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__28381__delegate.call(this, p1, p2, p3, ps)
    };
    G__28381.cljs$lang$maxFixedArity = 3;
    G__28381.cljs$lang$applyTo = function(arglist__28390) {
      var p1 = cljs.core.first(arglist__28390);
      var p2 = cljs.core.first(cljs.core.next(arglist__28390));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28390)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28390)));
      return G__28381__delegate.call(this, p1, p2, p3, ps)
    };
    return G__28381
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__28352.call(this, p1);
      case 2:
        return every_pred__28353.call(this, p1, p2);
      case 3:
        return every_pred__28354.call(this, p1, p2, p3);
      default:
        return every_pred__28355.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__28355.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__28430 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__28435 = function() {
        return null
      };
      var sp1__28436 = function(x) {
        return p.call(null, x)
      };
      var sp1__28437 = function(x, y) {
        var or__3548__auto____28392 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____28392)) {
          return or__3548__auto____28392
        }else {
          return p.call(null, y)
        }
      };
      var sp1__28438 = function(x, y, z) {
        var or__3548__auto____28393 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____28393)) {
          return or__3548__auto____28393
        }else {
          var or__3548__auto____28394 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____28394)) {
            return or__3548__auto____28394
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__28439 = function() {
        var G__28441__delegate = function(x, y, z, args) {
          var or__3548__auto____28395 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____28395)) {
            return or__3548__auto____28395
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__28441 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28441__delegate.call(this, x, y, z, args)
        };
        G__28441.cljs$lang$maxFixedArity = 3;
        G__28441.cljs$lang$applyTo = function(arglist__28442) {
          var x = cljs.core.first(arglist__28442);
          var y = cljs.core.first(cljs.core.next(arglist__28442));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28442)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28442)));
          return G__28441__delegate.call(this, x, y, z, args)
        };
        return G__28441
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__28435.call(this);
          case 1:
            return sp1__28436.call(this, x);
          case 2:
            return sp1__28437.call(this, x, y);
          case 3:
            return sp1__28438.call(this, x, y, z);
          default:
            return sp1__28439.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__28439.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__28431 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__28443 = function() {
        return null
      };
      var sp2__28444 = function(x) {
        var or__3548__auto____28396 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____28396)) {
          return or__3548__auto____28396
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__28445 = function(x, y) {
        var or__3548__auto____28397 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____28397)) {
          return or__3548__auto____28397
        }else {
          var or__3548__auto____28398 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____28398)) {
            return or__3548__auto____28398
          }else {
            var or__3548__auto____28399 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____28399)) {
              return or__3548__auto____28399
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__28446 = function(x, y, z) {
        var or__3548__auto____28400 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____28400)) {
          return or__3548__auto____28400
        }else {
          var or__3548__auto____28401 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____28401)) {
            return or__3548__auto____28401
          }else {
            var or__3548__auto____28402 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____28402)) {
              return or__3548__auto____28402
            }else {
              var or__3548__auto____28403 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____28403)) {
                return or__3548__auto____28403
              }else {
                var or__3548__auto____28404 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____28404)) {
                  return or__3548__auto____28404
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__28447 = function() {
        var G__28449__delegate = function(x, y, z, args) {
          var or__3548__auto____28405 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____28405)) {
            return or__3548__auto____28405
          }else {
            return cljs.core.some.call(null, function(p1__28308_SHARP_) {
              var or__3548__auto____28406 = p1.call(null, p1__28308_SHARP_);
              if(cljs.core.truth_(or__3548__auto____28406)) {
                return or__3548__auto____28406
              }else {
                return p2.call(null, p1__28308_SHARP_)
              }
            }, args)
          }
        };
        var G__28449 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28449__delegate.call(this, x, y, z, args)
        };
        G__28449.cljs$lang$maxFixedArity = 3;
        G__28449.cljs$lang$applyTo = function(arglist__28450) {
          var x = cljs.core.first(arglist__28450);
          var y = cljs.core.first(cljs.core.next(arglist__28450));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28450)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28450)));
          return G__28449__delegate.call(this, x, y, z, args)
        };
        return G__28449
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__28443.call(this);
          case 1:
            return sp2__28444.call(this, x);
          case 2:
            return sp2__28445.call(this, x, y);
          case 3:
            return sp2__28446.call(this, x, y, z);
          default:
            return sp2__28447.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__28447.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__28432 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__28451 = function() {
        return null
      };
      var sp3__28452 = function(x) {
        var or__3548__auto____28407 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____28407)) {
          return or__3548__auto____28407
        }else {
          var or__3548__auto____28408 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____28408)) {
            return or__3548__auto____28408
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__28453 = function(x, y) {
        var or__3548__auto____28409 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____28409)) {
          return or__3548__auto____28409
        }else {
          var or__3548__auto____28410 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____28410)) {
            return or__3548__auto____28410
          }else {
            var or__3548__auto____28411 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____28411)) {
              return or__3548__auto____28411
            }else {
              var or__3548__auto____28412 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____28412)) {
                return or__3548__auto____28412
              }else {
                var or__3548__auto____28413 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____28413)) {
                  return or__3548__auto____28413
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__28454 = function(x, y, z) {
        var or__3548__auto____28414 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____28414)) {
          return or__3548__auto____28414
        }else {
          var or__3548__auto____28415 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____28415)) {
            return or__3548__auto____28415
          }else {
            var or__3548__auto____28416 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____28416)) {
              return or__3548__auto____28416
            }else {
              var or__3548__auto____28417 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____28417)) {
                return or__3548__auto____28417
              }else {
                var or__3548__auto____28418 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____28418)) {
                  return or__3548__auto____28418
                }else {
                  var or__3548__auto____28419 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____28419)) {
                    return or__3548__auto____28419
                  }else {
                    var or__3548__auto____28420 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____28420)) {
                      return or__3548__auto____28420
                    }else {
                      var or__3548__auto____28421 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____28421)) {
                        return or__3548__auto____28421
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
      var sp3__28455 = function() {
        var G__28457__delegate = function(x, y, z, args) {
          var or__3548__auto____28422 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____28422)) {
            return or__3548__auto____28422
          }else {
            return cljs.core.some.call(null, function(p1__28309_SHARP_) {
              var or__3548__auto____28423 = p1.call(null, p1__28309_SHARP_);
              if(cljs.core.truth_(or__3548__auto____28423)) {
                return or__3548__auto____28423
              }else {
                var or__3548__auto____28424 = p2.call(null, p1__28309_SHARP_);
                if(cljs.core.truth_(or__3548__auto____28424)) {
                  return or__3548__auto____28424
                }else {
                  return p3.call(null, p1__28309_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__28457 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28457__delegate.call(this, x, y, z, args)
        };
        G__28457.cljs$lang$maxFixedArity = 3;
        G__28457.cljs$lang$applyTo = function(arglist__28458) {
          var x = cljs.core.first(arglist__28458);
          var y = cljs.core.first(cljs.core.next(arglist__28458));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28458)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28458)));
          return G__28457__delegate.call(this, x, y, z, args)
        };
        return G__28457
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__28451.call(this);
          case 1:
            return sp3__28452.call(this, x);
          case 2:
            return sp3__28453.call(this, x, y);
          case 3:
            return sp3__28454.call(this, x, y, z);
          default:
            return sp3__28455.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__28455.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__28433 = function() {
    var G__28459__delegate = function(p1, p2, p3, ps) {
      var ps__28425 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__28460 = function() {
          return null
        };
        var spn__28461 = function(x) {
          return cljs.core.some.call(null, function(p1__28310_SHARP_) {
            return p1__28310_SHARP_.call(null, x)
          }, ps__28425)
        };
        var spn__28462 = function(x, y) {
          return cljs.core.some.call(null, function(p1__28311_SHARP_) {
            var or__3548__auto____28426 = p1__28311_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____28426)) {
              return or__3548__auto____28426
            }else {
              return p1__28311_SHARP_.call(null, y)
            }
          }, ps__28425)
        };
        var spn__28463 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__28312_SHARP_) {
            var or__3548__auto____28427 = p1__28312_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____28427)) {
              return or__3548__auto____28427
            }else {
              var or__3548__auto____28428 = p1__28312_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____28428)) {
                return or__3548__auto____28428
              }else {
                return p1__28312_SHARP_.call(null, z)
              }
            }
          }, ps__28425)
        };
        var spn__28464 = function() {
          var G__28466__delegate = function(x, y, z, args) {
            var or__3548__auto____28429 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____28429)) {
              return or__3548__auto____28429
            }else {
              return cljs.core.some.call(null, function(p1__28313_SHARP_) {
                return cljs.core.some.call(null, p1__28313_SHARP_, args)
              }, ps__28425)
            }
          };
          var G__28466 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__28466__delegate.call(this, x, y, z, args)
          };
          G__28466.cljs$lang$maxFixedArity = 3;
          G__28466.cljs$lang$applyTo = function(arglist__28467) {
            var x = cljs.core.first(arglist__28467);
            var y = cljs.core.first(cljs.core.next(arglist__28467));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28467)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28467)));
            return G__28466__delegate.call(this, x, y, z, args)
          };
          return G__28466
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__28460.call(this);
            case 1:
              return spn__28461.call(this, x);
            case 2:
              return spn__28462.call(this, x, y);
            case 3:
              return spn__28463.call(this, x, y, z);
            default:
              return spn__28464.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__28464.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__28459 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__28459__delegate.call(this, p1, p2, p3, ps)
    };
    G__28459.cljs$lang$maxFixedArity = 3;
    G__28459.cljs$lang$applyTo = function(arglist__28468) {
      var p1 = cljs.core.first(arglist__28468);
      var p2 = cljs.core.first(cljs.core.next(arglist__28468));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28468)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28468)));
      return G__28459__delegate.call(this, p1, p2, p3, ps)
    };
    return G__28459
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__28430.call(this, p1);
      case 2:
        return some_fn__28431.call(this, p1, p2);
      case 3:
        return some_fn__28432.call(this, p1, p2, p3);
      default:
        return some_fn__28433.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__28433.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__28481 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____28469 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____28469)) {
        var s__28470 = temp__3698__auto____28469;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__28470)), map.call(null, f, cljs.core.rest.call(null, s__28470)))
      }else {
        return null
      }
    })
  };
  var map__28482 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__28471 = cljs.core.seq.call(null, c1);
      var s2__28472 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____28473 = s1__28471;
        if(cljs.core.truth_(and__3546__auto____28473)) {
          return s2__28472
        }else {
          return and__3546__auto____28473
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__28471), cljs.core.first.call(null, s2__28472)), map.call(null, f, cljs.core.rest.call(null, s1__28471), cljs.core.rest.call(null, s2__28472)))
      }else {
        return null
      }
    })
  };
  var map__28483 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__28474 = cljs.core.seq.call(null, c1);
      var s2__28475 = cljs.core.seq.call(null, c2);
      var s3__28476 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____28477 = s1__28474;
        if(cljs.core.truth_(and__3546__auto____28477)) {
          var and__3546__auto____28478 = s2__28475;
          if(cljs.core.truth_(and__3546__auto____28478)) {
            return s3__28476
          }else {
            return and__3546__auto____28478
          }
        }else {
          return and__3546__auto____28477
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__28474), cljs.core.first.call(null, s2__28475), cljs.core.first.call(null, s3__28476)), map.call(null, f, cljs.core.rest.call(null, s1__28474), cljs.core.rest.call(null, s2__28475), cljs.core.rest.call(null, s3__28476)))
      }else {
        return null
      }
    })
  };
  var map__28484 = function() {
    var G__28486__delegate = function(f, c1, c2, c3, colls) {
      var step__28480 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__28479 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__28479))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__28479), step.call(null, map.call(null, cljs.core.rest, ss__28479)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__28391_SHARP_) {
        return cljs.core.apply.call(null, f, p1__28391_SHARP_)
      }, step__28480.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__28486 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__28486__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__28486.cljs$lang$maxFixedArity = 4;
    G__28486.cljs$lang$applyTo = function(arglist__28487) {
      var f = cljs.core.first(arglist__28487);
      var c1 = cljs.core.first(cljs.core.next(arglist__28487));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28487)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28487))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__28487))));
      return G__28486__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__28486
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__28481.call(this, f, c1);
      case 3:
        return map__28482.call(this, f, c1, c2);
      case 4:
        return map__28483.call(this, f, c1, c2, c3);
      default:
        return map__28484.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__28484.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____28488 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____28488)) {
        var s__28489 = temp__3698__auto____28488;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__28489), take.call(null, n - 1, cljs.core.rest.call(null, s__28489)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__28492 = function(n, coll) {
    while(true) {
      var s__28490 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____28491 = n > 0;
        if(cljs.core.truth_(and__3546__auto____28491)) {
          return s__28490
        }else {
          return and__3546__auto____28491
        }
      }())) {
        var G__28493 = n - 1;
        var G__28494 = cljs.core.rest.call(null, s__28490);
        n = G__28493;
        coll = G__28494;
        continue
      }else {
        return s__28490
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__28492.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__28495 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__28496 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__28495.call(this, n);
      case 2:
        return drop_last__28496.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__28498 = cljs.core.seq.call(null, coll);
  var lead__28499 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__28499)) {
      var G__28500 = cljs.core.next.call(null, s__28498);
      var G__28501 = cljs.core.next.call(null, lead__28499);
      s__28498 = G__28500;
      lead__28499 = G__28501;
      continue
    }else {
      return s__28498
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__28504 = function(pred, coll) {
    while(true) {
      var s__28502 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____28503 = s__28502;
        if(cljs.core.truth_(and__3546__auto____28503)) {
          return pred.call(null, cljs.core.first.call(null, s__28502))
        }else {
          return and__3546__auto____28503
        }
      }())) {
        var G__28505 = pred;
        var G__28506 = cljs.core.rest.call(null, s__28502);
        pred = G__28505;
        coll = G__28506;
        continue
      }else {
        return s__28502
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__28504.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____28507 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____28507)) {
      var s__28508 = temp__3698__auto____28507;
      return cljs.core.concat.call(null, s__28508, cycle.call(null, s__28508))
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
  var repeat__28509 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__28510 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__28509.call(this, n);
      case 2:
        return repeat__28510.call(this, n, x)
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
  var repeatedly__28512 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__28513 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__28512.call(this, n);
      case 2:
        return repeatedly__28513.call(this, n, f)
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
  var interleave__28519 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__28515 = cljs.core.seq.call(null, c1);
      var s2__28516 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____28517 = s1__28515;
        if(cljs.core.truth_(and__3546__auto____28517)) {
          return s2__28516
        }else {
          return and__3546__auto____28517
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__28515), cljs.core.cons.call(null, cljs.core.first.call(null, s2__28516), interleave.call(null, cljs.core.rest.call(null, s1__28515), cljs.core.rest.call(null, s2__28516))))
      }else {
        return null
      }
    })
  };
  var interleave__28520 = function() {
    var G__28522__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__28518 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__28518))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__28518), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__28518)))
        }else {
          return null
        }
      })
    };
    var G__28522 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__28522__delegate.call(this, c1, c2, colls)
    };
    G__28522.cljs$lang$maxFixedArity = 2;
    G__28522.cljs$lang$applyTo = function(arglist__28523) {
      var c1 = cljs.core.first(arglist__28523);
      var c2 = cljs.core.first(cljs.core.next(arglist__28523));
      var colls = cljs.core.rest(cljs.core.next(arglist__28523));
      return G__28522__delegate.call(this, c1, c2, colls)
    };
    return G__28522
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__28519.call(this, c1, c2);
      default:
        return interleave__28520.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__28520.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__28526 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____28524 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____28524)) {
        var coll__28525 = temp__3695__auto____28524;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__28525), cat.call(null, cljs.core.rest.call(null, coll__28525), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__28526.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__28527 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__28528 = function() {
    var G__28530__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__28530 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__28530__delegate.call(this, f, coll, colls)
    };
    G__28530.cljs$lang$maxFixedArity = 2;
    G__28530.cljs$lang$applyTo = function(arglist__28531) {
      var f = cljs.core.first(arglist__28531);
      var coll = cljs.core.first(cljs.core.next(arglist__28531));
      var colls = cljs.core.rest(cljs.core.next(arglist__28531));
      return G__28530__delegate.call(this, f, coll, colls)
    };
    return G__28530
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__28527.call(this, f, coll);
      default:
        return mapcat__28528.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__28528.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____28532 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____28532)) {
      var s__28533 = temp__3698__auto____28532;
      var f__28534 = cljs.core.first.call(null, s__28533);
      var r__28535 = cljs.core.rest.call(null, s__28533);
      if(cljs.core.truth_(pred.call(null, f__28534))) {
        return cljs.core.cons.call(null, f__28534, filter.call(null, pred, r__28535))
      }else {
        return filter.call(null, pred, r__28535)
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
  var walk__28537 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__28537.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__28536_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__28536_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__28544 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__28545 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____28538 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____28538)) {
        var s__28539 = temp__3698__auto____28538;
        var p__28540 = cljs.core.take.call(null, n, s__28539);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__28540)))) {
          return cljs.core.cons.call(null, p__28540, partition.call(null, n, step, cljs.core.drop.call(null, step, s__28539)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__28546 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____28541 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____28541)) {
        var s__28542 = temp__3698__auto____28541;
        var p__28543 = cljs.core.take.call(null, n, s__28542);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__28543)))) {
          return cljs.core.cons.call(null, p__28543, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__28542)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__28543, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__28544.call(this, n, step);
      case 3:
        return partition__28545.call(this, n, step, pad);
      case 4:
        return partition__28546.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__28552 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__28553 = function(m, ks, not_found) {
    var sentinel__28548 = cljs.core.lookup_sentinel;
    var m__28549 = m;
    var ks__28550 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__28550)) {
        var m__28551 = cljs.core.get.call(null, m__28549, cljs.core.first.call(null, ks__28550), sentinel__28548);
        if(cljs.core.truth_(sentinel__28548 === m__28551)) {
          return not_found
        }else {
          var G__28555 = sentinel__28548;
          var G__28556 = m__28551;
          var G__28557 = cljs.core.next.call(null, ks__28550);
          sentinel__28548 = G__28555;
          m__28549 = G__28556;
          ks__28550 = G__28557;
          continue
        }
      }else {
        return m__28549
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__28552.call(this, m, ks);
      case 3:
        return get_in__28553.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__28558, v) {
  var vec__28559__28560 = p__28558;
  var k__28561 = cljs.core.nth.call(null, vec__28559__28560, 0, null);
  var ks__28562 = cljs.core.nthnext.call(null, vec__28559__28560, 1);
  if(cljs.core.truth_(ks__28562)) {
    return cljs.core.assoc.call(null, m, k__28561, assoc_in.call(null, cljs.core.get.call(null, m, k__28561), ks__28562, v))
  }else {
    return cljs.core.assoc.call(null, m, k__28561, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__28563, f, args) {
    var vec__28564__28565 = p__28563;
    var k__28566 = cljs.core.nth.call(null, vec__28564__28565, 0, null);
    var ks__28567 = cljs.core.nthnext.call(null, vec__28564__28565, 1);
    if(cljs.core.truth_(ks__28567)) {
      return cljs.core.assoc.call(null, m, k__28566, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__28566), ks__28567, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__28566, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__28566), args))
    }
  };
  var update_in = function(m, p__28563, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__28563, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__28568) {
    var m = cljs.core.first(arglist__28568);
    var p__28563 = cljs.core.first(cljs.core.next(arglist__28568));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28568)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28568)));
    return update_in__delegate.call(this, m, p__28563, f, args)
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
  var this__28569 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__28602 = null;
  var G__28602__28603 = function(coll, k) {
    var this__28570 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__28602__28604 = function(coll, k, not_found) {
    var this__28571 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__28602 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28602__28603.call(this, coll, k);
      case 3:
        return G__28602__28604.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28602
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__28572 = this;
  var new_array__28573 = cljs.core.aclone.call(null, this__28572.array);
  new_array__28573[k] = v;
  return new cljs.core.Vector(this__28572.meta, new_array__28573)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__28606 = null;
  var G__28606__28607 = function(tsym28574, k) {
    var this__28576 = this;
    var tsym28574__28577 = this;
    var coll__28578 = tsym28574__28577;
    return cljs.core._lookup.call(null, coll__28578, k)
  };
  var G__28606__28608 = function(tsym28575, k, not_found) {
    var this__28579 = this;
    var tsym28575__28580 = this;
    var coll__28581 = tsym28575__28580;
    return cljs.core._lookup.call(null, coll__28581, k, not_found)
  };
  G__28606 = function(tsym28575, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28606__28607.call(this, tsym28575, k);
      case 3:
        return G__28606__28608.call(this, tsym28575, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28606
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28582 = this;
  var new_array__28583 = cljs.core.aclone.call(null, this__28582.array);
  new_array__28583.push(o);
  return new cljs.core.Vector(this__28582.meta, new_array__28583)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__28610 = null;
  var G__28610__28611 = function(v, f) {
    var this__28584 = this;
    return cljs.core.ci_reduce.call(null, this__28584.array, f)
  };
  var G__28610__28612 = function(v, f, start) {
    var this__28585 = this;
    return cljs.core.ci_reduce.call(null, this__28585.array, f, start)
  };
  G__28610 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__28610__28611.call(this, v, f);
      case 3:
        return G__28610__28612.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28610
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__28586 = this;
  if(cljs.core.truth_(this__28586.array.length > 0)) {
    var vector_seq__28587 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__28586.array.length)) {
          return cljs.core.cons.call(null, this__28586.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__28587.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__28588 = this;
  return this__28588.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__28589 = this;
  var count__28590 = this__28589.array.length;
  if(cljs.core.truth_(count__28590 > 0)) {
    return this__28589.array[count__28590 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__28591 = this;
  if(cljs.core.truth_(this__28591.array.length > 0)) {
    var new_array__28592 = cljs.core.aclone.call(null, this__28591.array);
    new_array__28592.pop();
    return new cljs.core.Vector(this__28591.meta, new_array__28592)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__28593 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28594 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28595 = this;
  return new cljs.core.Vector(meta, this__28595.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28596 = this;
  return this__28596.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__28614 = null;
  var G__28614__28615 = function(coll, n) {
    var this__28597 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____28598 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____28598)) {
        return n < this__28597.array.length
      }else {
        return and__3546__auto____28598
      }
    }())) {
      return this__28597.array[n]
    }else {
      return null
    }
  };
  var G__28614__28616 = function(coll, n, not_found) {
    var this__28599 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____28600 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____28600)) {
        return n < this__28599.array.length
      }else {
        return and__3546__auto____28600
      }
    }())) {
      return this__28599.array[n]
    }else {
      return not_found
    }
  };
  G__28614 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28614__28615.call(this, coll, n);
      case 3:
        return G__28614__28616.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28614
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28601 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__28601.meta)
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
  vector.cljs$lang$applyTo = function(arglist__28618) {
    var args = cljs.core.seq(arglist__28618);
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
  var this__28619 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__28647 = null;
  var G__28647__28648 = function(coll, k) {
    var this__28620 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__28647__28649 = function(coll, k, not_found) {
    var this__28621 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__28647 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28647__28648.call(this, coll, k);
      case 3:
        return G__28647__28649.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28647
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__28622 = this;
  var v_pos__28623 = this__28622.start + key;
  return new cljs.core.Subvec(this__28622.meta, cljs.core._assoc.call(null, this__28622.v, v_pos__28623, val), this__28622.start, this__28622.end > v_pos__28623 + 1 ? this__28622.end : v_pos__28623 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__28651 = null;
  var G__28651__28652 = function(tsym28624, k) {
    var this__28626 = this;
    var tsym28624__28627 = this;
    var coll__28628 = tsym28624__28627;
    return cljs.core._lookup.call(null, coll__28628, k)
  };
  var G__28651__28653 = function(tsym28625, k, not_found) {
    var this__28629 = this;
    var tsym28625__28630 = this;
    var coll__28631 = tsym28625__28630;
    return cljs.core._lookup.call(null, coll__28631, k, not_found)
  };
  G__28651 = function(tsym28625, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28651__28652.call(this, tsym28625, k);
      case 3:
        return G__28651__28653.call(this, tsym28625, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28651
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28632 = this;
  return new cljs.core.Subvec(this__28632.meta, cljs.core._assoc_n.call(null, this__28632.v, this__28632.end, o), this__28632.start, this__28632.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__28655 = null;
  var G__28655__28656 = function(coll, f) {
    var this__28633 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__28655__28657 = function(coll, f, start) {
    var this__28634 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__28655 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__28655__28656.call(this, coll, f);
      case 3:
        return G__28655__28657.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28655
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__28635 = this;
  var subvec_seq__28636 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__28635.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__28635.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__28636.call(null, this__28635.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__28637 = this;
  return this__28637.end - this__28637.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__28638 = this;
  return cljs.core._nth.call(null, this__28638.v, this__28638.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__28639 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__28639.start, this__28639.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__28639.meta, this__28639.v, this__28639.start, this__28639.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__28640 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28641 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28642 = this;
  return new cljs.core.Subvec(meta, this__28642.v, this__28642.start, this__28642.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28643 = this;
  return this__28643.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__28659 = null;
  var G__28659__28660 = function(coll, n) {
    var this__28644 = this;
    return cljs.core._nth.call(null, this__28644.v, this__28644.start + n)
  };
  var G__28659__28661 = function(coll, n, not_found) {
    var this__28645 = this;
    return cljs.core._nth.call(null, this__28645.v, this__28645.start + n, not_found)
  };
  G__28659 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28659__28660.call(this, coll, n);
      case 3:
        return G__28659__28661.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28659
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28646 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__28646.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__28663 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__28664 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__28663.call(this, v, start);
      case 3:
        return subvec__28664.call(this, v, start, end)
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
  var this__28666 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__28667 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28668 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28669 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__28669.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28670 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__28671 = this;
  return cljs.core._first.call(null, this__28671.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__28672 = this;
  var temp__3695__auto____28673 = cljs.core.next.call(null, this__28672.front);
  if(cljs.core.truth_(temp__3695__auto____28673)) {
    var f1__28674 = temp__3695__auto____28673;
    return new cljs.core.PersistentQueueSeq(this__28672.meta, f1__28674, this__28672.rear)
  }else {
    if(cljs.core.truth_(this__28672.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__28672.meta, this__28672.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28675 = this;
  return this__28675.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28676 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__28676.front, this__28676.rear)
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
  var this__28677 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28678 = this;
  if(cljs.core.truth_(this__28678.front)) {
    return new cljs.core.PersistentQueue(this__28678.meta, this__28678.count + 1, this__28678.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____28679 = this__28678.rear;
      if(cljs.core.truth_(or__3548__auto____28679)) {
        return or__3548__auto____28679
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__28678.meta, this__28678.count + 1, cljs.core.conj.call(null, this__28678.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__28680 = this;
  var rear__28681 = cljs.core.seq.call(null, this__28680.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____28682 = this__28680.front;
    if(cljs.core.truth_(or__3548__auto____28682)) {
      return or__3548__auto____28682
    }else {
      return rear__28681
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__28680.front, cljs.core.seq.call(null, rear__28681))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__28683 = this;
  return this__28683.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__28684 = this;
  return cljs.core._first.call(null, this__28684.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__28685 = this;
  if(cljs.core.truth_(this__28685.front)) {
    var temp__3695__auto____28686 = cljs.core.next.call(null, this__28685.front);
    if(cljs.core.truth_(temp__3695__auto____28686)) {
      var f1__28687 = temp__3695__auto____28686;
      return new cljs.core.PersistentQueue(this__28685.meta, this__28685.count - 1, f1__28687, this__28685.rear)
    }else {
      return new cljs.core.PersistentQueue(this__28685.meta, this__28685.count - 1, cljs.core.seq.call(null, this__28685.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__28688 = this;
  return cljs.core.first.call(null, this__28688.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__28689 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28690 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28691 = this;
  return new cljs.core.PersistentQueue(meta, this__28691.count, this__28691.front, this__28691.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28692 = this;
  return this__28692.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28693 = this;
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
  var this__28694 = this;
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
  var len__28695 = array.length;
  var i__28696 = 0;
  while(true) {
    if(cljs.core.truth_(i__28696 < len__28695)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__28696]))) {
        return i__28696
      }else {
        var G__28697 = i__28696 + incr;
        i__28696 = G__28697;
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
  var obj_map_contains_key_QMARK___28699 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___28700 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____28698 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____28698)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____28698
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
        return obj_map_contains_key_QMARK___28699.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___28700.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__28703 = cljs.core.hash.call(null, a);
  var b__28704 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__28703 < b__28704)) {
    return-1
  }else {
    if(cljs.core.truth_(a__28703 > b__28704)) {
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
  var this__28705 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__28732 = null;
  var G__28732__28733 = function(coll, k) {
    var this__28706 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__28732__28734 = function(coll, k, not_found) {
    var this__28707 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__28707.strobj, this__28707.strobj[k], not_found)
  };
  G__28732 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28732__28733.call(this, coll, k);
      case 3:
        return G__28732__28734.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28732
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__28708 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__28709 = goog.object.clone.call(null, this__28708.strobj);
    var overwrite_QMARK___28710 = new_strobj__28709.hasOwnProperty(k);
    new_strobj__28709[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___28710)) {
      return new cljs.core.ObjMap(this__28708.meta, this__28708.keys, new_strobj__28709)
    }else {
      var new_keys__28711 = cljs.core.aclone.call(null, this__28708.keys);
      new_keys__28711.push(k);
      return new cljs.core.ObjMap(this__28708.meta, new_keys__28711, new_strobj__28709)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__28708.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__28712 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__28712.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__28736 = null;
  var G__28736__28737 = function(tsym28713, k) {
    var this__28715 = this;
    var tsym28713__28716 = this;
    var coll__28717 = tsym28713__28716;
    return cljs.core._lookup.call(null, coll__28717, k)
  };
  var G__28736__28738 = function(tsym28714, k, not_found) {
    var this__28718 = this;
    var tsym28714__28719 = this;
    var coll__28720 = tsym28714__28719;
    return cljs.core._lookup.call(null, coll__28720, k, not_found)
  };
  G__28736 = function(tsym28714, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28736__28737.call(this, tsym28714, k);
      case 3:
        return G__28736__28738.call(this, tsym28714, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28736
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__28721 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__28722 = this;
  if(cljs.core.truth_(this__28722.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__28702_SHARP_) {
      return cljs.core.vector.call(null, p1__28702_SHARP_, this__28722.strobj[p1__28702_SHARP_])
    }, this__28722.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__28723 = this;
  return this__28723.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28724 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28725 = this;
  return new cljs.core.ObjMap(meta, this__28725.keys, this__28725.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28726 = this;
  return this__28726.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28727 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__28727.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__28728 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____28729 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____28729)) {
      return this__28728.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____28729
    }
  }())) {
    var new_keys__28730 = cljs.core.aclone.call(null, this__28728.keys);
    var new_strobj__28731 = goog.object.clone.call(null, this__28728.strobj);
    new_keys__28730.splice(cljs.core.scan_array.call(null, 1, k, new_keys__28730), 1);
    cljs.core.js_delete.call(null, new_strobj__28731, k);
    return new cljs.core.ObjMap(this__28728.meta, new_keys__28730, new_strobj__28731)
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
  var this__28741 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__28779 = null;
  var G__28779__28780 = function(coll, k) {
    var this__28742 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__28779__28781 = function(coll, k, not_found) {
    var this__28743 = this;
    var bucket__28744 = this__28743.hashobj[cljs.core.hash.call(null, k)];
    var i__28745 = cljs.core.truth_(bucket__28744) ? cljs.core.scan_array.call(null, 2, k, bucket__28744) : null;
    if(cljs.core.truth_(i__28745)) {
      return bucket__28744[i__28745 + 1]
    }else {
      return not_found
    }
  };
  G__28779 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28779__28780.call(this, coll, k);
      case 3:
        return G__28779__28781.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28779
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__28746 = this;
  var h__28747 = cljs.core.hash.call(null, k);
  var bucket__28748 = this__28746.hashobj[h__28747];
  if(cljs.core.truth_(bucket__28748)) {
    var new_bucket__28749 = cljs.core.aclone.call(null, bucket__28748);
    var new_hashobj__28750 = goog.object.clone.call(null, this__28746.hashobj);
    new_hashobj__28750[h__28747] = new_bucket__28749;
    var temp__3695__auto____28751 = cljs.core.scan_array.call(null, 2, k, new_bucket__28749);
    if(cljs.core.truth_(temp__3695__auto____28751)) {
      var i__28752 = temp__3695__auto____28751;
      new_bucket__28749[i__28752 + 1] = v;
      return new cljs.core.HashMap(this__28746.meta, this__28746.count, new_hashobj__28750)
    }else {
      new_bucket__28749.push(k, v);
      return new cljs.core.HashMap(this__28746.meta, this__28746.count + 1, new_hashobj__28750)
    }
  }else {
    var new_hashobj__28753 = goog.object.clone.call(null, this__28746.hashobj);
    new_hashobj__28753[h__28747] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__28746.meta, this__28746.count + 1, new_hashobj__28753)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__28754 = this;
  var bucket__28755 = this__28754.hashobj[cljs.core.hash.call(null, k)];
  var i__28756 = cljs.core.truth_(bucket__28755) ? cljs.core.scan_array.call(null, 2, k, bucket__28755) : null;
  if(cljs.core.truth_(i__28756)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__28783 = null;
  var G__28783__28784 = function(tsym28757, k) {
    var this__28759 = this;
    var tsym28757__28760 = this;
    var coll__28761 = tsym28757__28760;
    return cljs.core._lookup.call(null, coll__28761, k)
  };
  var G__28783__28785 = function(tsym28758, k, not_found) {
    var this__28762 = this;
    var tsym28758__28763 = this;
    var coll__28764 = tsym28758__28763;
    return cljs.core._lookup.call(null, coll__28764, k, not_found)
  };
  G__28783 = function(tsym28758, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28783__28784.call(this, tsym28758, k);
      case 3:
        return G__28783__28785.call(this, tsym28758, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28783
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__28765 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__28766 = this;
  if(cljs.core.truth_(this__28766.count > 0)) {
    var hashes__28767 = cljs.core.js_keys.call(null, this__28766.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__28740_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__28766.hashobj[p1__28740_SHARP_]))
    }, hashes__28767)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__28768 = this;
  return this__28768.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28769 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28770 = this;
  return new cljs.core.HashMap(meta, this__28770.count, this__28770.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28771 = this;
  return this__28771.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28772 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__28772.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__28773 = this;
  var h__28774 = cljs.core.hash.call(null, k);
  var bucket__28775 = this__28773.hashobj[h__28774];
  var i__28776 = cljs.core.truth_(bucket__28775) ? cljs.core.scan_array.call(null, 2, k, bucket__28775) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__28776))) {
    return coll
  }else {
    var new_hashobj__28777 = goog.object.clone.call(null, this__28773.hashobj);
    if(cljs.core.truth_(3 > bucket__28775.length)) {
      cljs.core.js_delete.call(null, new_hashobj__28777, h__28774)
    }else {
      var new_bucket__28778 = cljs.core.aclone.call(null, bucket__28775);
      new_bucket__28778.splice(i__28776, 2);
      new_hashobj__28777[h__28774] = new_bucket__28778
    }
    return new cljs.core.HashMap(this__28773.meta, this__28773.count - 1, new_hashobj__28777)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__28787 = ks.length;
  var i__28788 = 0;
  var out__28789 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__28788 < len__28787)) {
      var G__28790 = i__28788 + 1;
      var G__28791 = cljs.core.assoc.call(null, out__28789, ks[i__28788], vs[i__28788]);
      i__28788 = G__28790;
      out__28789 = G__28791;
      continue
    }else {
      return out__28789
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__28792 = cljs.core.seq.call(null, keyvals);
    var out__28793 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__28792)) {
        var G__28794 = cljs.core.nnext.call(null, in$__28792);
        var G__28795 = cljs.core.assoc.call(null, out__28793, cljs.core.first.call(null, in$__28792), cljs.core.second.call(null, in$__28792));
        in$__28792 = G__28794;
        out__28793 = G__28795;
        continue
      }else {
        return out__28793
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
  hash_map.cljs$lang$applyTo = function(arglist__28796) {
    var keyvals = cljs.core.seq(arglist__28796);
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
      return cljs.core.reduce.call(null, function(p1__28797_SHARP_, p2__28798_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____28799 = p1__28797_SHARP_;
          if(cljs.core.truth_(or__3548__auto____28799)) {
            return or__3548__auto____28799
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__28798_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__28800) {
    var maps = cljs.core.seq(arglist__28800);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__28803 = function(m, e) {
        var k__28801 = cljs.core.first.call(null, e);
        var v__28802 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__28801))) {
          return cljs.core.assoc.call(null, m, k__28801, f.call(null, cljs.core.get.call(null, m, k__28801), v__28802))
        }else {
          return cljs.core.assoc.call(null, m, k__28801, v__28802)
        }
      };
      var merge2__28805 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__28803, function() {
          var or__3548__auto____28804 = m1;
          if(cljs.core.truth_(or__3548__auto____28804)) {
            return or__3548__auto____28804
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__28805, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__28806) {
    var f = cljs.core.first(arglist__28806);
    var maps = cljs.core.rest(arglist__28806);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__28808 = cljs.core.ObjMap.fromObject([], {});
  var keys__28809 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__28809)) {
      var key__28810 = cljs.core.first.call(null, keys__28809);
      var entry__28811 = cljs.core.get.call(null, map, key__28810, "\ufdd0'user/not-found");
      var G__28812 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__28811, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__28808, key__28810, entry__28811) : ret__28808;
      var G__28813 = cljs.core.next.call(null, keys__28809);
      ret__28808 = G__28812;
      keys__28809 = G__28813;
      continue
    }else {
      return ret__28808
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
  var this__28814 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__28835 = null;
  var G__28835__28836 = function(coll, v) {
    var this__28815 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__28835__28837 = function(coll, v, not_found) {
    var this__28816 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__28816.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__28835 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28835__28836.call(this, coll, v);
      case 3:
        return G__28835__28837.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28835
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__28839 = null;
  var G__28839__28840 = function(tsym28817, k) {
    var this__28819 = this;
    var tsym28817__28820 = this;
    var coll__28821 = tsym28817__28820;
    return cljs.core._lookup.call(null, coll__28821, k)
  };
  var G__28839__28841 = function(tsym28818, k, not_found) {
    var this__28822 = this;
    var tsym28818__28823 = this;
    var coll__28824 = tsym28818__28823;
    return cljs.core._lookup.call(null, coll__28824, k, not_found)
  };
  G__28839 = function(tsym28818, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28839__28840.call(this, tsym28818, k);
      case 3:
        return G__28839__28841.call(this, tsym28818, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28839
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__28825 = this;
  return new cljs.core.Set(this__28825.meta, cljs.core.assoc.call(null, this__28825.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__28826 = this;
  return cljs.core.keys.call(null, this__28826.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__28827 = this;
  return new cljs.core.Set(this__28827.meta, cljs.core.dissoc.call(null, this__28827.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__28828 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__28829 = this;
  var and__3546__auto____28830 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____28830)) {
    var and__3546__auto____28831 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____28831)) {
      return cljs.core.every_QMARK_.call(null, function(p1__28807_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__28807_SHARP_)
      }, other)
    }else {
      return and__3546__auto____28831
    }
  }else {
    return and__3546__auto____28830
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__28832 = this;
  return new cljs.core.Set(meta, this__28832.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__28833 = this;
  return this__28833.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__28834 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__28834.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__28844 = cljs.core.seq.call(null, coll);
  var out__28845 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__28844)))) {
      var G__28846 = cljs.core.rest.call(null, in$__28844);
      var G__28847 = cljs.core.conj.call(null, out__28845, cljs.core.first.call(null, in$__28844));
      in$__28844 = G__28846;
      out__28845 = G__28847;
      continue
    }else {
      return out__28845
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__28848 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____28849 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____28849)) {
        var e__28850 = temp__3695__auto____28849;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__28850))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__28848, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__28843_SHARP_) {
      var temp__3695__auto____28851 = cljs.core.find.call(null, smap, p1__28843_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____28851)) {
        var e__28852 = temp__3695__auto____28851;
        return cljs.core.second.call(null, e__28852)
      }else {
        return p1__28843_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__28860 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__28853, seen) {
        while(true) {
          var vec__28854__28855 = p__28853;
          var f__28856 = cljs.core.nth.call(null, vec__28854__28855, 0, null);
          var xs__28857 = vec__28854__28855;
          var temp__3698__auto____28858 = cljs.core.seq.call(null, xs__28857);
          if(cljs.core.truth_(temp__3698__auto____28858)) {
            var s__28859 = temp__3698__auto____28858;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__28856))) {
              var G__28861 = cljs.core.rest.call(null, s__28859);
              var G__28862 = seen;
              p__28853 = G__28861;
              seen = G__28862;
              continue
            }else {
              return cljs.core.cons.call(null, f__28856, step.call(null, cljs.core.rest.call(null, s__28859), cljs.core.conj.call(null, seen, f__28856)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__28860.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__28863 = cljs.core.Vector.fromArray([]);
  var s__28864 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__28864))) {
      var G__28865 = cljs.core.conj.call(null, ret__28863, cljs.core.first.call(null, s__28864));
      var G__28866 = cljs.core.next.call(null, s__28864);
      ret__28863 = G__28865;
      s__28864 = G__28866;
      continue
    }else {
      return cljs.core.seq.call(null, ret__28863)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____28867 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____28867)) {
        return or__3548__auto____28867
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__28868 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__28868 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__28868 + 1)
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
    var or__3548__auto____28869 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____28869)) {
      return or__3548__auto____28869
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__28870 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__28870 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__28870)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__28873 = cljs.core.ObjMap.fromObject([], {});
  var ks__28874 = cljs.core.seq.call(null, keys);
  var vs__28875 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____28876 = ks__28874;
      if(cljs.core.truth_(and__3546__auto____28876)) {
        return vs__28875
      }else {
        return and__3546__auto____28876
      }
    }())) {
      var G__28877 = cljs.core.assoc.call(null, map__28873, cljs.core.first.call(null, ks__28874), cljs.core.first.call(null, vs__28875));
      var G__28878 = cljs.core.next.call(null, ks__28874);
      var G__28879 = cljs.core.next.call(null, vs__28875);
      map__28873 = G__28877;
      ks__28874 = G__28878;
      vs__28875 = G__28879;
      continue
    }else {
      return map__28873
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__28882 = function(k, x) {
    return x
  };
  var max_key__28883 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__28884 = function() {
    var G__28886__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__28871_SHARP_, p2__28872_SHARP_) {
        return max_key.call(null, k, p1__28871_SHARP_, p2__28872_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__28886 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__28886__delegate.call(this, k, x, y, more)
    };
    G__28886.cljs$lang$maxFixedArity = 3;
    G__28886.cljs$lang$applyTo = function(arglist__28887) {
      var k = cljs.core.first(arglist__28887);
      var x = cljs.core.first(cljs.core.next(arglist__28887));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28887)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28887)));
      return G__28886__delegate.call(this, k, x, y, more)
    };
    return G__28886
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__28882.call(this, k, x);
      case 3:
        return max_key__28883.call(this, k, x, y);
      default:
        return max_key__28884.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__28884.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__28888 = function(k, x) {
    return x
  };
  var min_key__28889 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__28890 = function() {
    var G__28892__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__28880_SHARP_, p2__28881_SHARP_) {
        return min_key.call(null, k, p1__28880_SHARP_, p2__28881_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__28892 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__28892__delegate.call(this, k, x, y, more)
    };
    G__28892.cljs$lang$maxFixedArity = 3;
    G__28892.cljs$lang$applyTo = function(arglist__28893) {
      var k = cljs.core.first(arglist__28893);
      var x = cljs.core.first(cljs.core.next(arglist__28893));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28893)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28893)));
      return G__28892__delegate.call(this, k, x, y, more)
    };
    return G__28892
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__28888.call(this, k, x);
      case 3:
        return min_key__28889.call(this, k, x, y);
      default:
        return min_key__28890.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__28890.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__28896 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__28897 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____28894 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____28894)) {
        var s__28895 = temp__3698__auto____28894;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__28895), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__28895)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__28896.call(this, n, step);
      case 3:
        return partition_all__28897.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____28899 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____28899)) {
      var s__28900 = temp__3698__auto____28899;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__28900)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__28900), take_while.call(null, pred, cljs.core.rest.call(null, s__28900)))
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
  var this__28901 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__28902 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__28918 = null;
  var G__28918__28919 = function(rng, f) {
    var this__28903 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__28918__28920 = function(rng, f, s) {
    var this__28904 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__28918 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__28918__28919.call(this, rng, f);
      case 3:
        return G__28918__28920.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28918
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__28905 = this;
  var comp__28906 = cljs.core.truth_(this__28905.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__28906.call(null, this__28905.start, this__28905.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__28907 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__28907.end - this__28907.start) / this__28907.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__28908 = this;
  return this__28908.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__28909 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__28909.meta, this__28909.start + this__28909.step, this__28909.end, this__28909.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__28910 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__28911 = this;
  return new cljs.core.Range(meta, this__28911.start, this__28911.end, this__28911.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__28912 = this;
  return this__28912.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__28922 = null;
  var G__28922__28923 = function(rng, n) {
    var this__28913 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__28913.start + n * this__28913.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____28914 = this__28913.start > this__28913.end;
        if(cljs.core.truth_(and__3546__auto____28914)) {
          return cljs.core._EQ_.call(null, this__28913.step, 0)
        }else {
          return and__3546__auto____28914
        }
      }())) {
        return this__28913.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__28922__28924 = function(rng, n, not_found) {
    var this__28915 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__28915.start + n * this__28915.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____28916 = this__28915.start > this__28915.end;
        if(cljs.core.truth_(and__3546__auto____28916)) {
          return cljs.core._EQ_.call(null, this__28915.step, 0)
        }else {
          return and__3546__auto____28916
        }
      }())) {
        return this__28915.start
      }else {
        return not_found
      }
    }
  };
  G__28922 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__28922__28923.call(this, rng, n);
      case 3:
        return G__28922__28924.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__28922
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__28917 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__28917.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__28926 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__28927 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__28928 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__28929 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__28926.call(this);
      case 1:
        return range__28927.call(this, start);
      case 2:
        return range__28928.call(this, start, end);
      case 3:
        return range__28929.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____28931 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____28931)) {
      var s__28932 = temp__3698__auto____28931;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__28932), take_nth.call(null, n, cljs.core.drop.call(null, n, s__28932)))
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
    var temp__3698__auto____28934 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____28934)) {
      var s__28935 = temp__3698__auto____28934;
      var fst__28936 = cljs.core.first.call(null, s__28935);
      var fv__28937 = f.call(null, fst__28936);
      var run__28938 = cljs.core.cons.call(null, fst__28936, cljs.core.take_while.call(null, function(p1__28933_SHARP_) {
        return cljs.core._EQ_.call(null, fv__28937, f.call(null, p1__28933_SHARP_))
      }, cljs.core.next.call(null, s__28935)));
      return cljs.core.cons.call(null, run__28938, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__28938), s__28935))))
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
  var reductions__28953 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____28949 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____28949)) {
        var s__28950 = temp__3695__auto____28949;
        return reductions.call(null, f, cljs.core.first.call(null, s__28950), cljs.core.rest.call(null, s__28950))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__28954 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____28951 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____28951)) {
        var s__28952 = temp__3698__auto____28951;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__28952)), cljs.core.rest.call(null, s__28952))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__28953.call(this, f, init);
      case 3:
        return reductions__28954.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__28957 = function(f) {
    return function() {
      var G__28962 = null;
      var G__28962__28963 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__28962__28964 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__28962__28965 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__28962__28966 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__28962__28967 = function() {
        var G__28969__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__28969 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28969__delegate.call(this, x, y, z, args)
        };
        G__28969.cljs$lang$maxFixedArity = 3;
        G__28969.cljs$lang$applyTo = function(arglist__28970) {
          var x = cljs.core.first(arglist__28970);
          var y = cljs.core.first(cljs.core.next(arglist__28970));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28970)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28970)));
          return G__28969__delegate.call(this, x, y, z, args)
        };
        return G__28969
      }();
      G__28962 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__28962__28963.call(this);
          case 1:
            return G__28962__28964.call(this, x);
          case 2:
            return G__28962__28965.call(this, x, y);
          case 3:
            return G__28962__28966.call(this, x, y, z);
          default:
            return G__28962__28967.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__28962.cljs$lang$maxFixedArity = 3;
      G__28962.cljs$lang$applyTo = G__28962__28967.cljs$lang$applyTo;
      return G__28962
    }()
  };
  var juxt__28958 = function(f, g) {
    return function() {
      var G__28971 = null;
      var G__28971__28972 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__28971__28973 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__28971__28974 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__28971__28975 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__28971__28976 = function() {
        var G__28978__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__28978 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28978__delegate.call(this, x, y, z, args)
        };
        G__28978.cljs$lang$maxFixedArity = 3;
        G__28978.cljs$lang$applyTo = function(arglist__28979) {
          var x = cljs.core.first(arglist__28979);
          var y = cljs.core.first(cljs.core.next(arglist__28979));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28979)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28979)));
          return G__28978__delegate.call(this, x, y, z, args)
        };
        return G__28978
      }();
      G__28971 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__28971__28972.call(this);
          case 1:
            return G__28971__28973.call(this, x);
          case 2:
            return G__28971__28974.call(this, x, y);
          case 3:
            return G__28971__28975.call(this, x, y, z);
          default:
            return G__28971__28976.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__28971.cljs$lang$maxFixedArity = 3;
      G__28971.cljs$lang$applyTo = G__28971__28976.cljs$lang$applyTo;
      return G__28971
    }()
  };
  var juxt__28959 = function(f, g, h) {
    return function() {
      var G__28980 = null;
      var G__28980__28981 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__28980__28982 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__28980__28983 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__28980__28984 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__28980__28985 = function() {
        var G__28987__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__28987 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__28987__delegate.call(this, x, y, z, args)
        };
        G__28987.cljs$lang$maxFixedArity = 3;
        G__28987.cljs$lang$applyTo = function(arglist__28988) {
          var x = cljs.core.first(arglist__28988);
          var y = cljs.core.first(cljs.core.next(arglist__28988));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28988)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28988)));
          return G__28987__delegate.call(this, x, y, z, args)
        };
        return G__28987
      }();
      G__28980 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__28980__28981.call(this);
          case 1:
            return G__28980__28982.call(this, x);
          case 2:
            return G__28980__28983.call(this, x, y);
          case 3:
            return G__28980__28984.call(this, x, y, z);
          default:
            return G__28980__28985.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__28980.cljs$lang$maxFixedArity = 3;
      G__28980.cljs$lang$applyTo = G__28980__28985.cljs$lang$applyTo;
      return G__28980
    }()
  };
  var juxt__28960 = function() {
    var G__28989__delegate = function(f, g, h, fs) {
      var fs__28956 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__28990 = null;
        var G__28990__28991 = function() {
          return cljs.core.reduce.call(null, function(p1__28939_SHARP_, p2__28940_SHARP_) {
            return cljs.core.conj.call(null, p1__28939_SHARP_, p2__28940_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__28956)
        };
        var G__28990__28992 = function(x) {
          return cljs.core.reduce.call(null, function(p1__28941_SHARP_, p2__28942_SHARP_) {
            return cljs.core.conj.call(null, p1__28941_SHARP_, p2__28942_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__28956)
        };
        var G__28990__28993 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__28943_SHARP_, p2__28944_SHARP_) {
            return cljs.core.conj.call(null, p1__28943_SHARP_, p2__28944_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__28956)
        };
        var G__28990__28994 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__28945_SHARP_, p2__28946_SHARP_) {
            return cljs.core.conj.call(null, p1__28945_SHARP_, p2__28946_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__28956)
        };
        var G__28990__28995 = function() {
          var G__28997__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__28947_SHARP_, p2__28948_SHARP_) {
              return cljs.core.conj.call(null, p1__28947_SHARP_, cljs.core.apply.call(null, p2__28948_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__28956)
          };
          var G__28997 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__28997__delegate.call(this, x, y, z, args)
          };
          G__28997.cljs$lang$maxFixedArity = 3;
          G__28997.cljs$lang$applyTo = function(arglist__28998) {
            var x = cljs.core.first(arglist__28998);
            var y = cljs.core.first(cljs.core.next(arglist__28998));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28998)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28998)));
            return G__28997__delegate.call(this, x, y, z, args)
          };
          return G__28997
        }();
        G__28990 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__28990__28991.call(this);
            case 1:
              return G__28990__28992.call(this, x);
            case 2:
              return G__28990__28993.call(this, x, y);
            case 3:
              return G__28990__28994.call(this, x, y, z);
            default:
              return G__28990__28995.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__28990.cljs$lang$maxFixedArity = 3;
        G__28990.cljs$lang$applyTo = G__28990__28995.cljs$lang$applyTo;
        return G__28990
      }()
    };
    var G__28989 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__28989__delegate.call(this, f, g, h, fs)
    };
    G__28989.cljs$lang$maxFixedArity = 3;
    G__28989.cljs$lang$applyTo = function(arglist__28999) {
      var f = cljs.core.first(arglist__28999);
      var g = cljs.core.first(cljs.core.next(arglist__28999));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__28999)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__28999)));
      return G__28989__delegate.call(this, f, g, h, fs)
    };
    return G__28989
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__28957.call(this, f);
      case 2:
        return juxt__28958.call(this, f, g);
      case 3:
        return juxt__28959.call(this, f, g, h);
      default:
        return juxt__28960.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__28960.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__29001 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__29004 = cljs.core.next.call(null, coll);
        coll = G__29004;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__29002 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____29000 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____29000)) {
          return n > 0
        }else {
          return and__3546__auto____29000
        }
      }())) {
        var G__29005 = n - 1;
        var G__29006 = cljs.core.next.call(null, coll);
        n = G__29005;
        coll = G__29006;
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
        return dorun__29001.call(this, n);
      case 2:
        return dorun__29002.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__29007 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__29008 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__29007.call(this, n);
      case 2:
        return doall__29008.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__29010 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__29010), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__29010), 1))) {
      return cljs.core.first.call(null, matches__29010)
    }else {
      return cljs.core.vec.call(null, matches__29010)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__29011 = re.exec(s);
  if(cljs.core.truth_(matches__29011 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__29011), 1))) {
      return cljs.core.first.call(null, matches__29011)
    }else {
      return cljs.core.vec.call(null, matches__29011)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__29012 = cljs.core.re_find.call(null, re, s);
  var match_idx__29013 = s.search(re);
  var match_str__29014 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__29012)) ? cljs.core.first.call(null, match_data__29012) : match_data__29012;
  var post_match__29015 = cljs.core.subs.call(null, s, match_idx__29013 + cljs.core.count.call(null, match_str__29014));
  if(cljs.core.truth_(match_data__29012)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__29012, re_seq.call(null, re, post_match__29015))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__29017__29018 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___29019 = cljs.core.nth.call(null, vec__29017__29018, 0, null);
  var flags__29020 = cljs.core.nth.call(null, vec__29017__29018, 1, null);
  var pattern__29021 = cljs.core.nth.call(null, vec__29017__29018, 2, null);
  return new RegExp(pattern__29021, flags__29020)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__29016_SHARP_) {
    return print_one.call(null, p1__29016_SHARP_, opts)
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
          var and__3546__auto____29022 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____29022)) {
            var and__3546__auto____29026 = function() {
              var x__450__auto____29023 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____29024 = x__450__auto____29023;
                if(cljs.core.truth_(and__3546__auto____29024)) {
                  var and__3546__auto____29025 = x__450__auto____29023.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____29025)) {
                    return cljs.core.not.call(null, x__450__auto____29023.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____29025
                  }
                }else {
                  return and__3546__auto____29024
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____29023)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____29026)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____29026
            }
          }else {
            return and__3546__auto____29022
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__450__auto____29027 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____29028 = x__450__auto____29027;
            if(cljs.core.truth_(and__3546__auto____29028)) {
              var and__3546__auto____29029 = x__450__auto____29027.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____29029)) {
                return cljs.core.not.call(null, x__450__auto____29027.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____29029
              }
            }else {
              return and__3546__auto____29028
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__450__auto____29027)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__29030 = cljs.core.first.call(null, objs);
  var sb__29031 = new goog.string.StringBuffer;
  var G__29032__29033 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__29032__29033)) {
    var obj__29034 = cljs.core.first.call(null, G__29032__29033);
    var G__29032__29035 = G__29032__29033;
    while(true) {
      if(cljs.core.truth_(obj__29034 === first_obj__29030)) {
      }else {
        sb__29031.append(" ")
      }
      var G__29036__29037 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__29034, opts));
      if(cljs.core.truth_(G__29036__29037)) {
        var string__29038 = cljs.core.first.call(null, G__29036__29037);
        var G__29036__29039 = G__29036__29037;
        while(true) {
          sb__29031.append(string__29038);
          var temp__3698__auto____29040 = cljs.core.next.call(null, G__29036__29039);
          if(cljs.core.truth_(temp__3698__auto____29040)) {
            var G__29036__29041 = temp__3698__auto____29040;
            var G__29044 = cljs.core.first.call(null, G__29036__29041);
            var G__29045 = G__29036__29041;
            string__29038 = G__29044;
            G__29036__29039 = G__29045;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____29042 = cljs.core.next.call(null, G__29032__29035);
      if(cljs.core.truth_(temp__3698__auto____29042)) {
        var G__29032__29043 = temp__3698__auto____29042;
        var G__29046 = cljs.core.first.call(null, G__29032__29043);
        var G__29047 = G__29032__29043;
        obj__29034 = G__29046;
        G__29032__29035 = G__29047;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__29031)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__29048 = cljs.core.first.call(null, objs);
  var G__29049__29050 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__29049__29050)) {
    var obj__29051 = cljs.core.first.call(null, G__29049__29050);
    var G__29049__29052 = G__29049__29050;
    while(true) {
      if(cljs.core.truth_(obj__29051 === first_obj__29048)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__29053__29054 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__29051, opts));
      if(cljs.core.truth_(G__29053__29054)) {
        var string__29055 = cljs.core.first.call(null, G__29053__29054);
        var G__29053__29056 = G__29053__29054;
        while(true) {
          cljs.core.string_print.call(null, string__29055);
          var temp__3698__auto____29057 = cljs.core.next.call(null, G__29053__29056);
          if(cljs.core.truth_(temp__3698__auto____29057)) {
            var G__29053__29058 = temp__3698__auto____29057;
            var G__29061 = cljs.core.first.call(null, G__29053__29058);
            var G__29062 = G__29053__29058;
            string__29055 = G__29061;
            G__29053__29056 = G__29062;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____29059 = cljs.core.next.call(null, G__29049__29052);
      if(cljs.core.truth_(temp__3698__auto____29059)) {
        var G__29049__29060 = temp__3698__auto____29059;
        var G__29063 = cljs.core.first.call(null, G__29049__29060);
        var G__29064 = G__29049__29060;
        obj__29051 = G__29063;
        G__29049__29052 = G__29064;
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
  pr_str.cljs$lang$applyTo = function(arglist__29065) {
    var objs = cljs.core.seq(arglist__29065);
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
  pr.cljs$lang$applyTo = function(arglist__29066) {
    var objs = cljs.core.seq(arglist__29066);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__29067) {
    var objs = cljs.core.seq(arglist__29067);
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
  println.cljs$lang$applyTo = function(arglist__29068) {
    var objs = cljs.core.seq(arglist__29068);
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
  prn.cljs$lang$applyTo = function(arglist__29069) {
    var objs = cljs.core.seq(arglist__29069);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__29070 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__29070, "{", ", ", "}", opts, coll)
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
      var temp__3698__auto____29071 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____29071)) {
        var nspc__29072 = temp__3698__auto____29071;
        return cljs.core.str.call(null, nspc__29072, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____29073 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____29073)) {
          var nspc__29074 = temp__3698__auto____29073;
          return cljs.core.str.call(null, nspc__29074, "/")
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
  var pr_pair__29075 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__29075, "{", ", ", "}", opts, coll)
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
  var this__29076 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__29077 = this;
  var G__29078__29079 = cljs.core.seq.call(null, this__29077.watches);
  if(cljs.core.truth_(G__29078__29079)) {
    var G__29081__29083 = cljs.core.first.call(null, G__29078__29079);
    var vec__29082__29084 = G__29081__29083;
    var key__29085 = cljs.core.nth.call(null, vec__29082__29084, 0, null);
    var f__29086 = cljs.core.nth.call(null, vec__29082__29084, 1, null);
    var G__29078__29087 = G__29078__29079;
    var G__29081__29088 = G__29081__29083;
    var G__29078__29089 = G__29078__29087;
    while(true) {
      var vec__29090__29091 = G__29081__29088;
      var key__29092 = cljs.core.nth.call(null, vec__29090__29091, 0, null);
      var f__29093 = cljs.core.nth.call(null, vec__29090__29091, 1, null);
      var G__29078__29094 = G__29078__29089;
      f__29093.call(null, key__29092, this$, oldval, newval);
      var temp__3698__auto____29095 = cljs.core.next.call(null, G__29078__29094);
      if(cljs.core.truth_(temp__3698__auto____29095)) {
        var G__29078__29096 = temp__3698__auto____29095;
        var G__29103 = cljs.core.first.call(null, G__29078__29096);
        var G__29104 = G__29078__29096;
        G__29081__29088 = G__29103;
        G__29078__29089 = G__29104;
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
  var this__29097 = this;
  return this$.watches = cljs.core.assoc.call(null, this__29097.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__29098 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__29098.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__29099 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__29099.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__29100 = this;
  return this__29100.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__29101 = this;
  return this__29101.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__29102 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__29111 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__29112 = function() {
    var G__29114__delegate = function(x, p__29105) {
      var map__29106__29107 = p__29105;
      var map__29106__29108 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__29106__29107)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__29106__29107) : map__29106__29107;
      var validator__29109 = cljs.core.get.call(null, map__29106__29108, "\ufdd0'validator");
      var meta__29110 = cljs.core.get.call(null, map__29106__29108, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__29110, validator__29109, null)
    };
    var G__29114 = function(x, var_args) {
      var p__29105 = null;
      if(goog.isDef(var_args)) {
        p__29105 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__29114__delegate.call(this, x, p__29105)
    };
    G__29114.cljs$lang$maxFixedArity = 1;
    G__29114.cljs$lang$applyTo = function(arglist__29115) {
      var x = cljs.core.first(arglist__29115);
      var p__29105 = cljs.core.rest(arglist__29115);
      return G__29114__delegate.call(this, x, p__29105)
    };
    return G__29114
  }();
  atom = function(x, var_args) {
    var p__29105 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__29111.call(this, x);
      default:
        return atom__29112.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__29112.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____29116 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____29116)) {
    var validate__29117 = temp__3698__auto____29116;
    if(cljs.core.truth_(validate__29117.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3073)))));
    }
  }else {
  }
  var old_value__29118 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__29118, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___29119 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___29120 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___29121 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___29122 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___29123 = function() {
    var G__29125__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__29125 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__29125__delegate.call(this, a, f, x, y, z, more)
    };
    G__29125.cljs$lang$maxFixedArity = 5;
    G__29125.cljs$lang$applyTo = function(arglist__29126) {
      var a = cljs.core.first(arglist__29126);
      var f = cljs.core.first(cljs.core.next(arglist__29126));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__29126)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__29126))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__29126)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__29126)))));
      return G__29125__delegate.call(this, a, f, x, y, z, more)
    };
    return G__29125
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___29119.call(this, a, f);
      case 3:
        return swap_BANG___29120.call(this, a, f, x);
      case 4:
        return swap_BANG___29121.call(this, a, f, x, y);
      case 5:
        return swap_BANG___29122.call(this, a, f, x, y, z);
      default:
        return swap_BANG___29123.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___29123.cljs$lang$applyTo;
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__29127) {
    var iref = cljs.core.first(arglist__29127);
    var f = cljs.core.first(cljs.core.next(arglist__29127));
    var args = cljs.core.rest(cljs.core.next(arglist__29127));
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
  var gensym__29128 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__29129 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__29128.call(this);
      case 1:
        return gensym__29129.call(this, prefix_string)
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
  var this__29131 = this;
  return cljs.core.not.call(null, cljs.core.deref.call(null, this__29131.state) === null)
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__29132 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__29132.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__29132.state, this__29132.f)
  }
  return cljs.core.deref.call(null, this__29132.state)
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
  delay.cljs$lang$applyTo = function(arglist__29133) {
    var body = cljs.core.seq(arglist__29133);
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
    var map__29134__29135 = options;
    var map__29134__29136 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__29134__29135)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__29134__29135) : map__29134__29135;
    var keywordize_keys__29137 = cljs.core.get.call(null, map__29134__29136, "\ufdd0'keywordize-keys");
    var keyfn__29138 = cljs.core.truth_(keywordize_keys__29137) ? cljs.core.keyword : cljs.core.str;
    var f__29144 = function thisfn(x) {
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
                var iter__514__auto____29143 = function iter__29139(s__29140) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__29140__29141 = s__29140;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__29140__29141))) {
                        var k__29142 = cljs.core.first.call(null, s__29140__29141);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__29138.call(null, k__29142), thisfn.call(null, x[k__29142])]), iter__29139.call(null, cljs.core.rest.call(null, s__29140__29141)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__514__auto____29143.call(null, cljs.core.js_keys.call(null, x))
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
    return f__29144.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__29145) {
    var x = cljs.core.first(arglist__29145);
    var options = cljs.core.rest(arglist__29145);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__29146 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__29150__delegate = function(args) {
      var temp__3695__auto____29147 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__29146), args);
      if(cljs.core.truth_(temp__3695__auto____29147)) {
        var v__29148 = temp__3695__auto____29147;
        return v__29148
      }else {
        var ret__29149 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__29146, cljs.core.assoc, args, ret__29149);
        return ret__29149
      }
    };
    var G__29150 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__29150__delegate.call(this, args)
    };
    G__29150.cljs$lang$maxFixedArity = 0;
    G__29150.cljs$lang$applyTo = function(arglist__29151) {
      var args = cljs.core.seq(arglist__29151);
      return G__29150__delegate.call(this, args)
    };
    return G__29150
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__29153 = function(f) {
    while(true) {
      var ret__29152 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__29152))) {
        var G__29156 = ret__29152;
        f = G__29156;
        continue
      }else {
        return ret__29152
      }
      break
    }
  };
  var trampoline__29154 = function() {
    var G__29157__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__29157 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__29157__delegate.call(this, f, args)
    };
    G__29157.cljs$lang$maxFixedArity = 1;
    G__29157.cljs$lang$applyTo = function(arglist__29158) {
      var f = cljs.core.first(arglist__29158);
      var args = cljs.core.rest(arglist__29158);
      return G__29157__delegate.call(this, f, args)
    };
    return G__29157
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__29153.call(this, f);
      default:
        return trampoline__29154.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__29154.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__29159 = function() {
    return rand.call(null, 1)
  };
  var rand__29160 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__29159.call(this);
      case 1:
        return rand__29160.call(this, n)
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
    var k__29162 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__29162, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__29162, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___29171 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___29172 = function(h, child, parent) {
    var or__3548__auto____29163 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____29163)) {
      return or__3548__auto____29163
    }else {
      var or__3548__auto____29164 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____29164)) {
        return or__3548__auto____29164
      }else {
        var and__3546__auto____29165 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____29165)) {
          var and__3546__auto____29166 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____29166)) {
            var and__3546__auto____29167 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____29167)) {
              var ret__29168 = true;
              var i__29169 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____29170 = cljs.core.not.call(null, ret__29168);
                  if(cljs.core.truth_(or__3548__auto____29170)) {
                    return or__3548__auto____29170
                  }else {
                    return cljs.core._EQ_.call(null, i__29169, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__29168
                }else {
                  var G__29174 = isa_QMARK_.call(null, h, child.call(null, i__29169), parent.call(null, i__29169));
                  var G__29175 = i__29169 + 1;
                  ret__29168 = G__29174;
                  i__29169 = G__29175;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____29167
            }
          }else {
            return and__3546__auto____29166
          }
        }else {
          return and__3546__auto____29165
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___29171.call(this, h, child);
      case 3:
        return isa_QMARK___29172.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__29176 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__29177 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__29176.call(this, h);
      case 2:
        return parents__29177.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__29179 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__29180 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__29179.call(this, h);
      case 2:
        return ancestors__29180.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__29182 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__29183 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__29182.call(this, h);
      case 2:
        return descendants__29183.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__29193 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3365)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__29194 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3369)))));
    }
    var tp__29188 = "\ufdd0'parents".call(null, h);
    var td__29189 = "\ufdd0'descendants".call(null, h);
    var ta__29190 = "\ufdd0'ancestors".call(null, h);
    var tf__29191 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____29192 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__29188.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__29190.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__29190.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__29188, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__29191.call(null, "\ufdd0'ancestors".call(null, h), tag, td__29189, parent, ta__29190), "\ufdd0'descendants":tf__29191.call(null, "\ufdd0'descendants".call(null, h), parent, ta__29190, tag, td__29189)})
    }();
    if(cljs.core.truth_(or__3548__auto____29192)) {
      return or__3548__auto____29192
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__29193.call(this, h, tag);
      case 3:
        return derive__29194.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__29200 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__29201 = function(h, tag, parent) {
    var parentMap__29196 = "\ufdd0'parents".call(null, h);
    var childsParents__29197 = cljs.core.truth_(parentMap__29196.call(null, tag)) ? cljs.core.disj.call(null, parentMap__29196.call(null, tag), parent) : cljs.core.set([]);
    var newParents__29198 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__29197)) ? cljs.core.assoc.call(null, parentMap__29196, tag, childsParents__29197) : cljs.core.dissoc.call(null, parentMap__29196, tag);
    var deriv_seq__29199 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__29185_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__29185_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__29185_SHARP_), cljs.core.second.call(null, p1__29185_SHARP_)))
    }, cljs.core.seq.call(null, newParents__29198)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__29196.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__29186_SHARP_, p2__29187_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__29186_SHARP_, p2__29187_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__29199))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__29200.call(this, h, tag);
      case 3:
        return underive__29201.call(this, h, tag, parent)
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
  var xprefs__29203 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____29205 = cljs.core.truth_(function() {
    var and__3546__auto____29204 = xprefs__29203;
    if(cljs.core.truth_(and__3546__auto____29204)) {
      return xprefs__29203.call(null, y)
    }else {
      return and__3546__auto____29204
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____29205)) {
    return or__3548__auto____29205
  }else {
    var or__3548__auto____29207 = function() {
      var ps__29206 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__29206) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__29206), prefer_table))) {
          }else {
          }
          var G__29210 = cljs.core.rest.call(null, ps__29206);
          ps__29206 = G__29210;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____29207)) {
      return or__3548__auto____29207
    }else {
      var or__3548__auto____29209 = function() {
        var ps__29208 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__29208) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__29208), y, prefer_table))) {
            }else {
            }
            var G__29211 = cljs.core.rest.call(null, ps__29208);
            ps__29208 = G__29211;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____29209)) {
        return or__3548__auto____29209
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____29212 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____29212)) {
    return or__3548__auto____29212
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__29221 = cljs.core.reduce.call(null, function(be, p__29213) {
    var vec__29214__29215 = p__29213;
    var k__29216 = cljs.core.nth.call(null, vec__29214__29215, 0, null);
    var ___29217 = cljs.core.nth.call(null, vec__29214__29215, 1, null);
    var e__29218 = vec__29214__29215;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__29216))) {
      var be2__29220 = cljs.core.truth_(function() {
        var or__3548__auto____29219 = be === null;
        if(cljs.core.truth_(or__3548__auto____29219)) {
          return or__3548__auto____29219
        }else {
          return cljs.core.dominates.call(null, k__29216, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__29218 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__29220), k__29216, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__29216, " and ", cljs.core.first.call(null, be2__29220), ", and neither is preferred"));
      }
      return be2__29220
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__29221)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__29221));
      return cljs.core.second.call(null, best_entry__29221)
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
    var and__3546__auto____29222 = mf;
    if(cljs.core.truth_(and__3546__auto____29222)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____29222
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____29223 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____29223)) {
        return or__3548__auto____29223
      }else {
        var or__3548__auto____29224 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____29224)) {
          return or__3548__auto____29224
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____29225 = mf;
    if(cljs.core.truth_(and__3546__auto____29225)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____29225
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____29226 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____29226)) {
        return or__3548__auto____29226
      }else {
        var or__3548__auto____29227 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____29227)) {
          return or__3548__auto____29227
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____29228 = mf;
    if(cljs.core.truth_(and__3546__auto____29228)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____29228
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____29229 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____29229)) {
        return or__3548__auto____29229
      }else {
        var or__3548__auto____29230 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____29230)) {
          return or__3548__auto____29230
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____29231 = mf;
    if(cljs.core.truth_(and__3546__auto____29231)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____29231
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____29232 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____29232)) {
        return or__3548__auto____29232
      }else {
        var or__3548__auto____29233 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____29233)) {
          return or__3548__auto____29233
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____29234 = mf;
    if(cljs.core.truth_(and__3546__auto____29234)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____29234
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____29235 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____29235)) {
        return or__3548__auto____29235
      }else {
        var or__3548__auto____29236 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____29236)) {
          return or__3548__auto____29236
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____29237 = mf;
    if(cljs.core.truth_(and__3546__auto____29237)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____29237
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____29238 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____29238)) {
        return or__3548__auto____29238
      }else {
        var or__3548__auto____29239 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____29239)) {
          return or__3548__auto____29239
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____29240 = mf;
    if(cljs.core.truth_(and__3546__auto____29240)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____29240
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____29241 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____29241)) {
        return or__3548__auto____29241
      }else {
        var or__3548__auto____29242 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____29242)) {
          return or__3548__auto____29242
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____29243 = mf;
    if(cljs.core.truth_(and__3546__auto____29243)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____29243
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____29244 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____29244)) {
        return or__3548__auto____29244
      }else {
        var or__3548__auto____29245 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____29245)) {
          return or__3548__auto____29245
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__29246 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__29247 = cljs.core._get_method.call(null, mf, dispatch_val__29246);
  if(cljs.core.truth_(target_fn__29247)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__29246));
  }
  return cljs.core.apply.call(null, target_fn__29247, args)
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
  var this__29248 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__29249 = this;
  cljs.core.swap_BANG_.call(null, this__29249.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__29249.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__29249.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__29249.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__29250 = this;
  cljs.core.swap_BANG_.call(null, this__29250.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__29250.method_cache, this__29250.method_table, this__29250.cached_hierarchy, this__29250.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__29251 = this;
  cljs.core.swap_BANG_.call(null, this__29251.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__29251.method_cache, this__29251.method_table, this__29251.cached_hierarchy, this__29251.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__29252 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__29252.cached_hierarchy), cljs.core.deref.call(null, this__29252.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__29252.method_cache, this__29252.method_table, this__29252.cached_hierarchy, this__29252.hierarchy)
  }
  var temp__3695__auto____29253 = cljs.core.deref.call(null, this__29252.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____29253)) {
    var target_fn__29254 = temp__3695__auto____29253;
    return target_fn__29254
  }else {
    var temp__3695__auto____29255 = cljs.core.find_and_cache_best_method.call(null, this__29252.name, dispatch_val, this__29252.hierarchy, this__29252.method_table, this__29252.prefer_table, this__29252.method_cache, this__29252.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____29255)) {
      var target_fn__29256 = temp__3695__auto____29255;
      return target_fn__29256
    }else {
      return cljs.core.deref.call(null, this__29252.method_table).call(null, this__29252.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__29257 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__29257.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__29257.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__29257.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__29257.method_cache, this__29257.method_table, this__29257.cached_hierarchy, this__29257.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__29258 = this;
  return cljs.core.deref.call(null, this__29258.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__29259 = this;
  return cljs.core.deref.call(null, this__29259.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__29260 = this;
  return cljs.core.do_dispatch.call(null, mf, this__29260.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__29261__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__29261 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__29261__delegate.call(this, _, args)
  };
  G__29261.cljs$lang$maxFixedArity = 1;
  G__29261.cljs$lang$applyTo = function(arglist__29262) {
    var _ = cljs.core.first(arglist__29262);
    var args = cljs.core.rest(arglist__29262);
    return G__29261__delegate.call(this, _, args)
  };
  return G__29261
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
example.log.debugEnabled = false;
example.log.infoEnabled = true;
example.log.log = function log(level, s) {
  return console.log(cljs.core.apply.call(null, cljs.core.str, cljs.core.cons.call(null, cljs.core.str.call(null, "[", level, "] "), s)))
};
example.log.debug = function() {
  var debug__delegate = function(s) {
    if(cljs.core.truth_(example.log.debugEnabled)) {
      return example.log.log.call(null, "DEBUG", s)
    }else {
      return null
    }
  };
  var debug = function(var_args) {
    var s = null;
    if(goog.isDef(var_args)) {
      s = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return debug__delegate.call(this, s)
  };
  debug.cljs$lang$maxFixedArity = 0;
  debug.cljs$lang$applyTo = function(arglist__27527) {
    var s = cljs.core.seq(arglist__27527);
    return debug__delegate.call(this, s)
  };
  return debug
}();
example.log.info = function() {
  var info__delegate = function(s) {
    if(cljs.core.truth_(example.log.infoEnabled)) {
      return example.log.log.call(null, "INFO", s)
    }else {
      return null
    }
  };
  var info = function(var_args) {
    var s = null;
    if(goog.isDef(var_args)) {
      s = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return info__delegate.call(this, s)
  };
  info.cljs$lang$maxFixedArity = 0;
  info.cljs$lang$applyTo = function(arglist__27528) {
    var s = cljs.core.seq(arglist__27528);
    return info__delegate.call(this, s)
  };
  return info
}();
goog.provide("example.model");
goog.require("cljs.core");
goog.require("goog.Timer");
goog.require("goog.events");
goog.require("example.log");
example.model.WIDTH = 100;
example.model.HEIGHT = 50;
example.model.SIZE = example.model.WIDTH * example.model.HEIGHT;
example.model.fill_random = function fill_random() {
  return cljs.core.vec.call(null, cljs.core.map.call(null, function(_) {
    if(cljs.core.truth_(0.6 < cljs.core.rand.call(null, 1))) {
      return"\ufdd0'live"
    }else {
      return"\ufdd0'dead"
    }
  }, cljs.core.range.call(null, example.model.SIZE)))
};
example.model.grid = cljs.core.atom.call(null, example.model.fill_random.call(null));
example.model.living_QMARK_ = function living_QMARK_(x) {
  return cljs.core._EQ_.call(null, x, "\ufdd0'live")
};
example.model.alive_now_QMARK_ = function alive_now_QMARK_(x) {
  return example.model.living_QMARK_.call(null, example.model.grid_now.call(null, x))
};
example.model.timer = cljs.core.atom.call(null, null);
example.model.adjacent_indices = function adjacent_indices(index) {
  return cljs.core.filter.call(null, function(p1__27529_SHARP_) {
    var and__3546__auto____27538 = -1 < p1__27529_SHARP_;
    if(cljs.core.truth_(and__3546__auto____27538)) {
      return p1__27529_SHARP_ < example.model.SIZE
    }else {
      return and__3546__auto____27538
    }
  }, cljs.core.juxt.call(null, function(p1__27530_SHARP_) {
    return p1__27530_SHARP_ - 1
  }, function(p1__27531_SHARP_) {
    return p1__27531_SHARP_ + 1
  }, function(p1__27532_SHARP_) {
    return p1__27532_SHARP_ - example.model.WIDTH
  }, function(p1__27533_SHARP_) {
    return p1__27533_SHARP_ + example.model.WIDTH
  }, function(p1__27534_SHARP_) {
    return p1__27534_SHARP_ - (example.model.WIDTH + 1)
  }, function(p1__27535_SHARP_) {
    return p1__27535_SHARP_ + (example.model.WIDTH + 1)
  }, function(p1__27536_SHARP_) {
    return p1__27536_SHARP_ - (example.model.WIDTH - 1)
  }, function(p1__27537_SHARP_) {
    return p1__27537_SHARP_ + (example.model.WIDTH - 1)
  }).call(null, index))
};
example.model.alive_next_time_QMARK_ = function alive_next_time_QMARK_(index, val) {
  var vals_at_indices__27539 = cljs.core.map.call(null, example.model.grid_now, example.model.adjacent_indices.call(null, index));
  var nlive__27540 = cljs.core.count.call(null, cljs.core.filter.call(null, example.model.living_QMARK_, vals_at_indices__27539));
  if(cljs.core.truth_(function() {
    var or__3548__auto____27541 = nlive__27540 > 3;
    if(cljs.core.truth_(or__3548__auto____27541)) {
      return or__3548__auto____27541
    }else {
      return nlive__27540 < 2
    }
  }())) {
    return"\ufdd0'dead"
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, nlive__27540, 3))) {
      return"\ufdd0'live"
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____27542 = cljs.core._EQ_.call(null, nlive__27540, 2);
        if(cljs.core.truth_(and__3546__auto____27542)) {
          return example.model.alive_now_QMARK_.call(null, index)
        }else {
          return and__3546__auto____27542
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
  example.log.info.call(null, "update-model");
  var grid_now27544__27545 = example.model.grid_now;
  try {
    example.model.grid_now = cljs.core.deref.call(null, example.model.grid);
    cljs.core.swap_BANG_.call(null, example.model.grid, function(p1__27543_SHARP_) {
      return cljs.core.vec.call(null, cljs.core.map_indexed.call(null, example.model.alive_next_time_QMARK_, p1__27543_SHARP_))
    })
  }finally {
    example.model.grid_now = grid_now27544__27545
  }
  return example.log.debug.call(null, "update-model-end")
};
example.model.add_listener = function add_listener(f) {
  return cljs.core.add_watch.call(null, example.model.grid, null, function(k, r, o, n) {
    return f.call(null, n)
  })
};
example.model.start_timer = function start_timer() {
  var timer__27547 = new goog.Timer(1E3);
  example.model.update_model.call(null);
  timer__27547.start();
  return goog.events.listen.call(null, timer__27547, goog.Timer.TICK, example.model.update_model)
};
example.model.toggle_run = function toggle_run() {
  example.log.info.call(null, "toggle-run!");
  return example.model.start_timer.call(null)
};
goog.provide("example.view");
goog.require("cljs.core");
goog.require("example.model");
goog.require("example.log");
goog.require("goog.dom");
goog.require("goog.events");
example.view.by_id = function by_id(id) {
  return goog.dom.getElement(id)
};
example.view.set_cell_state = function set_cell_state(x, y, state) {
  var temp__3695__auto____27550 = example.view.by_id.call(null, cljs.core.str.call(null, x, "-", y));
  if(cljs.core.truth_(temp__3695__auto____27550)) {
    var e__27551 = temp__3695__auto____27550;
    if(cljs.core.truth_(cljs.core._EQ_.call(null, state, "\ufdd0'dead"))) {
      e__27551.removeAttribute("class")
    }else {
      e__27551.setAttribute("class", cljs.core.name.call(null, state))
    }
  }else {
  }
  return example.view.xs
};
example.view.update_view = function update_view(grid) {
  example.log.debug.call(null, "update-view", grid);
  cljs.core.doall.call(null, cljs.core.map_indexed.call(null, function(p1__27548_SHARP_, p2__27549_SHARP_) {
    var x__27552 = p1__27548_SHARP_ % example.model.WIDTH;
    var y__27553 = Math.floor.call(null, p1__27548_SHARP_ / example.model.WIDTH);
    return example.view.set_cell_state.call(null, x__27552, y__27553, p2__27549_SHARP_)
  }, grid));
  return example.log.debug.call(null, "update-view-end")
};
example.view.create_table = function create_table() {
  return example.view.by_id.call(null, "content").innerHTML = cljs.core.apply.call(null, cljs.core.str, cljs.core.flatten.call(null, cljs.core.Vector.fromArray(["<table id='game-of-life'>", function() {
    var iter__514__auto____27563 = function iter__27554(s__27555) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__27555__27556 = s__27555;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__27555__27556))) {
            var y__27557 = cljs.core.first.call(null, s__27555__27556);
            return cljs.core.cons.call(null, cljs.core.Vector.fromArray(["<tr>", function() {
              var iter__514__auto____27562 = function(y__27557) {
                return function iter__27558(s__27559) {
                  return new cljs.core.LazySeq(null, false, function(y__27557) {
                    return function() {
                      var s__27559__27560 = s__27559;
                      while(true) {
                        if(cljs.core.truth_(cljs.core.seq.call(null, s__27559__27560))) {
                          var x__27561 = cljs.core.first.call(null, s__27559__27560);
                          return cljs.core.cons.call(null, cljs.core.Vector.fromArray([cljs.core.str.call(null, "<td id='", cljs.core.str.call(null, x__27561, "-", y__27557), "'>")]), iter__27558.call(null, cljs.core.rest.call(null, s__27559__27560)))
                        }else {
                          return null
                        }
                        break
                      }
                    }
                  }(y__27557))
                }
              }(y__27557);
              return iter__514__auto____27562.call(null, cljs.core.range.call(null, example.model.WIDTH))
            }(), "</tr>"]), iter__27554.call(null, cljs.core.rest.call(null, s__27555__27556)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__514__auto____27563.call(null, cljs.core.range.call(null, example.model.HEIGHT))
  }(), "</table>"])))
};
example.view.initialise = function initialise() {
  example.view.create_table.call(null);
  example.model.toggle_run.call(null);
  return example.model.add_listener.call(null, example.view.update_view)
};
window.onload = example.view.initialise;
goog.provide("example.repl");
goog.require("cljs.core");
