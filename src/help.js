[1mBasic Usage:
[0m --compilation_level (-O) WERT          : Specifies the compilation level to
                                          use. Options: WHITESPACE_ONLY,
                                          SIMPLE, ADVANCED (Vorgabe: SIMPLE)
 --env [BROWSER | CUSTOM]               : Determines the set of builtin externs
                                          to load. Options: BROWSER, CUSTOM.
                                          Defaults to BROWSER. (Vorgabe:
                                          BROWSER)
 --externs WERT                         : The file containing JavaScript
                                          externs. You may specify multiple
 --js WERT                              : The JavaScript filename. You may
                                          specify multiple. The flag name is
                                          optional, because args are
                                          interpreted as files by default. You
                                          may also use minimatch-style glob
                                          patterns. For example, use
                                          --js='**.js' --js='!**_test.js' to
                                          recursively include all js files that
                                          do not end in _test.js
 --js_output_file WERT                  : Primary output filename. If not
                                          specified, output is written to
                                          stdout (Vorgabe: )
 --language_in WERT                     : Sets what language spec that input
                                          sources conform. Options:
                                          ECMASCRIPT3, ECMASCRIPT5,
                                          ECMASCRIPT5_STRICT, ECMASCRIPT6
                                          (default), ECMASCRIPT6_STRICT,
                                          ECMASCRIPT6_TYPED (experimental)
                                          (Vorgabe: ECMASCRIPT6)
 --language_out WERT                    : Sets what language spec the output
                                          should conform to. Options:
                                          ECMASCRIPT3 (default), ECMASCRIPT5,
                                          ECMASCRIPT5_STRICT, ECMASCRIPT6_TYPED
                                          (experimental) (Vorgabe: ECMASCRIPT3)
 --warning_level (-W) [QUIET | DEFAULT  : Specifies the warning level to use.
 | VERBOSE]                               Options: QUIET, DEFAULT, VERBOSE
                                          (Vorgabe: DEFAULT)


[1mWarning and Error Management:
[0m --conformance_configs WERT             : A list of JS Conformance
                                          configurations in text protocol
                                          buffer format.
 --extra_annotation_name WERT           : A whitelist of tag names in JSDoc.
                                          You may specify multiple
 --hide_warnings_for WERT               : If specified, files whose path
                                          contains this string will have their
                                          warnings hidden. You may specify
                                          multiple.
 --jscomp_error WERT                    : Make the named class of warnings an
                                          error. Must be one of the error group
                                          items. '*' adds all supported.
 --jscomp_off WERT                      : Turn off the named class of warnings.
                                          Must be one of the error group items.
                                          '*' adds all supported.
 --jscomp_warning WERT                  : Make the named class of warnings a
                                          normal warning. Must be one of the
                                          error group items. '*' adds all
                                          supported.
 --new_type_inf                         : Checks for type errors using the new
                                          type inference algorithm. (Vorgabe:
                                          false)
 --warnings_whitelist_file WERT         : A file containing warnings to
                                          suppress. Each line should be of the
                                          form
                                          <file-name>:<line-number>? 
                                          <warning-description> (Vorgabe: )

[1mAvailable Error Groups: [0maccessControls, ambiguousFunctionDecl,
    checkEventfulObjectDisposal, checkRegExp, checkTypes, checkVars,
    commonJsModuleLoad, conformanceViolations, const, constantProperty,
    deprecated, deprecatedAnnotations, duplicateMessage, es3, es5Strict,
    externsValidation, fileoverviewTags, functionParams, globalThis,
    internetExplorerChecks, invalidCasts, misplacedTypeAnnotation,
    missingGetCssName, missingOverride, missingPolyfill, missingProperties,
    missingProvide, missingRequire, missingReturn, msgDescriptions,
    newCheckTypes, nonStandardJsDocs, missingSourcesWarnings,
    reportUnknownTypes, suspiciousCode, strictModuleDepCheck, typeInvalidation,
    undefinedNames, undefinedVars, unknownDefines, unusedLocalVariables,
    unusedPrivateMembers, uselessCode, useOfGoogBase, underscore, visibility

[1mOutput:
[0m --assume_function_wrapper              : Enable additional optimizations based
                                          on the assumption that the output
                                          will be wrapped with a function
                                          wrapper.  This flag is used to
                                          indicate that "global" declarations
                                          will not actually be global but
                                          instead isolated to the compilation
                                          unit. This enables additional
                                          optimizations. (Vorgabe: false)
 --export_local_property_definitions    : Generates export code for local
                                          properties marked with @export
                                          (Vorgabe: false)
 --formatting [PRETTY_PRINT |           : Specifies which formatting options,
 PRINT_INPUT_DELIMITER | SINGLE_QUOTES]   if any, should be applied to the
                                          output JS. Options: PRETTY_PRINT,
                                          PRINT_INPUT_DELIMITER, SINGLE_QUOTES
 --generate_exports                     : Generates export code for those
                                          marked with @export (Vorgabe: false)
 --isolation_mode [NONE | IIFE]         : If set to IIFE the compiler output
                                          will follow the form:
                                            (function(){%output%)).call(this);
                                          Options: NONE, IIFE (Vorgabe: NONE)
 --output_wrapper WERT                  : Interpolate output into this string
                                          at the place denoted by the marker
                                          token %output%. Use marker token
                                          %output|jsstring% to do js string
                                          escaping on the output. Consider
                                          using the --isolation_mode flag
                                          instead. (Vorgabe: )
 --output_wrapper_file WERT             : Loads the specified file and passes
                                          the file contents to the
                                          --output_wrapper flag, replacing the
                                          value if it exists. This is useful if
                                          you want special characters like
                                          newline in the wrapper. (Vorgabe: )


[1mDependency Management:
[0m --dependency_mode [NONE | LOOSE |      : Specifies how the compiler should
 STRICT]                                  determine the set and order of files
                                          for a compilation. Options: NONE the
                                          compiler will include all src files
                                          in the order listed, STRICT files
                                          will be included and sorted by
                                          starting from namespaces or files
                                          listed by the --entry_point flag -
                                          files will only be included if they
                                          are referenced by a goog.require or
                                          CommonJS require or ES6 import, LOOSE
                                          same as with STRICT but files which
                                          do not goog.provide a namespace and
                                          are not modules will be automatically
                                          added as --entry_point entries.
                                          Defaults to NONE. (Vorgabe: NONE)
 --entry_point WERT                     : A file or namespace to use as the
                                          starting point for determining which
                                          src files to include in the
                                          compilation. ES6 and CommonJS modules
                                          are specified as file paths (without
                                          the extension). Closure-library
                                          namespaces are specified with a
                                          "goog:" prefix. Example:
                                          --entry_point=goog:goog.Promise


[1mJS Modules:
[0m --js_module_root WERT                  : Path prefixes to be removed from ES6
                                          & CommonJS modules.
 --module_resolution [BROWSER | LEGACY  : Specifies how the compiler locates
 | NODE]                                  modules. BROWSER requires all module
                                          imports to begin with a '.' or '/'
                                          and have a file extension. NODE uses
                                          the node module rules. LEGACY
                                          prepends a '/' to any import not
                                          already beginning with a '.' or '/'.
                                          (Vorgabe: LEGACY)
 --process_common_js_modules            : Process CommonJS modules to a
                                          concatenable form. (Vorgabe: false)
 --transform_amd_modules                : Transform AMD to CommonJS modules.
                                          (Vorgabe: false)


[1mLibrary and Framework Specific:
[0m --angular_pass                         : Generate $inject properties for
                                          AngularJS for functions annotated
                                          with @ngInject (Vorgabe: false)
 --dart_pass                            : Rewrite Dart Dev Compiler output to
                                          be compiler-friendly. (Vorgabe: false)
 --force_inject_library WERT            : Force injection of named runtime
                                          libraries. The format is <name> where
                                          <name> is the name of a runtime
                                          library. Possible libraries include:
                                          base, es6_runtime, runtime_type_check
 --inject_libraries                     : Allow injecting runtime libraries.
                                          (Vorgabe: true)
 --polymer_pass                         : Equivalent to --polymer_version=1
                                          (Vorgabe: false)
 --process_closure_primitives           : Processes built-ins from the Closure
                                          library, such as goog.require(),
                                          goog.provide(), and goog.exportSymbol(
                                          ). True by default. (Vorgabe: true)
 --rewrite_polyfills                    : Rewrite ES6 library calls to use
                                          polyfills provided by the compiler's
                                          runtime. (Vorgabe: true)


[1mCode Splitting:
[0m --module WERT                          : A JavaScript module specification.
                                          The format is <name>:<num-js-files>[:[
                                          <dep>,...][:]]]. Module names must be
                                          unique. Each dep is the name of a
                                          module that this module depends on.
                                          Modules must be listed in dependency
                                          order, and JS source files must be
                                          listed in the corresponding order.
                                          Where --module flags occur in
                                          relation to --js flags is
                                          unimportant. <num-js-files> may be
                                          set to 'auto' for the first module if
                                          it has no dependencies. Provide the
                                          value 'auto' to trigger module
                                          creation from CommonJSmodules.
 --module_output_path_prefix WERT       : Prefix for filenames of compiled JS
                                          modules. <module-name>.js will be
                                          appended to this prefix. Directories
                                          will be created as needed. Use with
                                          --module (Vorgabe: ./)
 --module_wrapper WERT                  : An output wrapper for a JavaScript
                                          module (optional). The format is
                                          <name>:<wrapper>. The module name
                                          must correspond with a module
                                          specified using --module. The wrapper
                                          must contain %s as the code
                                          placeholder. The %basename%
                                          placeholder can also be used to
                                          substitute the base name of the
                                          module output file.


[1mReports:
[0m --create_source_map WERT               : If specified, a source map file
                                          mapping the generated source files
                                          back to the original source file will
                                          be output to the specified path. The
                                          %outname% placeholder will expand to
                                          the name of the output file that the
                                          source map corresponds to. (Vorgabe: )
 --output_manifest WERT                 : Prints out a list of all the files in
                                          the compilation. If --dependency_mode=
                                          STRICT or LOOSE is specified, this
                                          will not include files that got
                                          dropped because they were not
                                          required. The %outname% placeholder
                                          expands to the JS output file. If
                                          you're using modularization, using
                                          %outname% will create a manifest for
                                          each module. (Vorgabe: )
 --output_module_dependencies WERT      : Prints out a JSON file of
                                          dependencies between modules.
                                          (Vorgabe: )
 --property_renaming_report WERT        : File where the serialized version of
                                          the property renaming map produced
                                          should be saved (Vorgabe: )
 --source_map_include_content           : Includes sources content into source
                                          map. Greatly increases the size of
                                          source maps but offers greater
                                          portability (Vorgabe: false)
 --source_map_input WERT                : Source map locations for input files,
                                          separated by a '|', (i.e.
                                          input-file-path|input-source-map)
 --source_map_location_mapping WERT     : Source map location mapping separated
                                          by a '|' (i.e. filesystem-path|webserv
                                          er-path)
 --variable_renaming_report WERT        : File where the serialized version of
                                          the variable renaming map produced
                                          should be saved (Vorgabe: )


[1mMiscellaneous:
[0m --charset WERT                         : Input and output charset for all
                                          files. By default, we accept UTF-8 as
                                          input and output US_ASCII (Vorgabe: )
 --checks_only (--checks-only)          : Don't generate output. Run checks,
                                          but no optimization passes. (Vorgabe:
                                          false)
 --define (--D, -D) WERT                : Override the value of a variable
                                          annotated @define. The format is
                                          <name>[=<val>], where <name> is the
                                          name of a @define variable and <val>
                                          is a boolean, number, or a
                                          single-quoted string that contains no
                                          single quotes. If [=<val>] is
                                          omitted, the variable is marked true
 --help                                 : Displays this message on stdout and
                                          exit (Vorgabe: true)
 --third_party                          : Check source validity but do not
                                          enforce Closure style rules and
                                          conventions (Vorgabe: false)
 --use_types_for_optimization           : Enable or disable the optimizations
                                          based on available type information.
                                          Inaccurate type annotations may
                                          result in incorrect results.
                                          (Vorgabe: true)
 --version                              : Prints the compiler version to stdout
                                          and exit. (Vorgabe: false)
