/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!./default.html", "editor/editor", "util/lang" ],
  function( LAYOUT_SRC, Editor, LangUtils ) {

  /**
   * Class: DefaultEditor
   *
   * Implements the default editor as a general fallback editor
   *
   * @param {DOMElement} rootElement: Root DOM element containing the fundamental editor content
   * @param {Butter} butter: An instance of Butter
   * @param {TrackEvent} TrackEvent: The TrackEvent to edit
   */
  function DefaultEditor( rootElement, butter, compiledLayout, events ) {

    var _this = this;

    events = events || {};

    var _rootElement = rootElement,
        _trackEvent,
        _targets = [ butter.currentMedia ].concat( butter.targets ),
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _oldOpenEvent = events.open,
        _oldCloseEvent = events.close;

    /**
     * Member: setErrorState
     *
     * Sets the error state of the editor, making an error message visible
     *
     * @param {String} message: Error message to display
     */
    function setErrorState ( message ) {
      if ( message ) {
        _messageContainer.innerHTML = message;
        _messageContainer.parentNode.style.height = _messageContainer.offsetHeight + "px";
        _messageContainer.parentNode.style.visibility = "visible";
        _messageContainer.parentNode.classList.add( "open" );
      }
      else {
        _messageContainer.innerHTML = "";
        _messageContainer.parentNode.style.height = "";
        _messageContainer.parentNode.style.visibility = "";
        _messageContainer.parentNode.classList.remove( "open" );
      }
    }

    function onTrackEventUpdated( e ) {
      _this.updatePropertiesFromManifest( e.target );
      setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    events.open = function ( parentElement, trackEvent ) {
      var targetList,
          optionsContainer = _rootElement.querySelector( ".editor-options" ),
          selectElement;

      _this.applyExtraHeadTags( compiledLayout );

      _trackEvent = trackEvent;

      optionsContainer.appendChild( _this.createStartEndInputs( trackEvent, updateTrackEvent ) );

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: function( elementType, element, trackEvent, name ) {
          if ( elementType === "select" ) {
            _this.attachSelectChangeHandler( element, trackEvent, name, updateTrackEvent );
          }
          else {
            if ( element.type === "checkbox" ) {
              _this.attachCheckboxChangeHandler( element, trackEvent, name, updateTrackEvent );
            }
            else {
              _this.attachInputChangeHandler( element, trackEvent, name, updateTrackEvent );
            }
          }
        },
        basicContainer: optionsContainer,
        ignoreManifestKeys: [ "target", "start", "end" ],
        safeCallback: updateTrackEvent
      });

      if ( trackEvent.manifest.options.target && !trackEvent.manifest.options.target.hidden ) {
        targetList = _this.createTargetsList( _targets );
        selectElement = targetList.querySelector( "select" );
        // Attach the onchange handler to trackEvent is updated when <select> is changed
        _this.attachSelectChangeHandler( selectElement, trackEvent, "target" );
        optionsContainer.appendChild( targetList );
      }

      _this.updatePropertiesFromManifest( trackEvent, null, true );

      // Catch the end of a transition for when the error message box opens/closes
      if ( _this.scrollbar ) {
        LangUtils.applyTransitionEndListener( _messageContainer.parentNode, _this.scrollbar.update );
      }

      _this.scrollbar.update();

      // Update properties when TrackEvent is updated
      trackEvent.listen( "trackeventupdated", onTrackEventUpdated );

      if ( _oldOpenEvent ) {
        _oldOpenEvent.apply( this, arguments );
      }
    };
    events.close = function () {
      _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      if ( _oldCloseEvent ) {
        _oldCloseEvent.apply( this, arguments );
      }
    };

    Editor.TrackEventEditor.extend( _this, butter, rootElement, events );

    /**
     * Member: updateTrackEvent
     *
     * Attempt to update the properties of a TrackEvent; set the error state if a failure occurs.
     *
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {Object} properties: TrackEvent properties to update
     */
    function updateTrackEvent( trackEvent, properties ) {
      try {
        trackEvent.update( properties );
      }
      catch ( e ) {
        setErrorState( e.toString() );
      }
    }

  }

  Editor.register( "default", LAYOUT_SRC, DefaultEditor );

  return {
    extend: function( extendObject, rootElement, butter, compiledLayout, events ){
      return DefaultEditor.apply( extendObject, [ rootElement, butter, compiledLayout, events ] );
    },
    EDITOR_SRC: LAYOUT_SRC
  };

});
