(function() {
  var addAlert, onCsvFileInputChange, onCsvLoaded, onDownload, onInputColumnChange, refreshInputData, setInput, setInputProjection, setOutputProjection,
    _this = this;

  this.inputHeaders = [];

  this.inputData = [];

  this.coordIndices = [0, 0];

  this.inputProj = new Proj4js.Proj('EPSG:4236');

  this.outputProj = new Proj4js.Proj('EPSG:4236');

  this.outputFilename = 'projected.csv';

  $(function() {
    var _this = this;
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
      addAlert('Your browser does not support the HTML5 "File" API and so this web site will not work.');
      return;
    }
    $('#csv-input').change(onCsvFileInputChange);
    $('#input-x').change(onInputColumnChange);
    $('#input-y').change(onInputColumnChange);
    $('#input-projection').change(function() {
      return setInputProjection($('#input-projection').children('option:selected').val());
    });
    $('#output-projection').change(function() {
      return setOutputProjection($('#output-projection').children('option:selected').val());
    });
    $('#input-projection').change();
    $('#output-projection').change();
    return $('#download').click(onDownload);
  });

  onCsvFileInputChange = function(event) {
    var file, reader;
    if (!event.target.files.length || event.target.files.length === 0) {
      addAlert('No file selected');
    }
    file = event.target.files[0];
    reader = new FileReader;
    reader.onload = function() {
      _this.outputFilename = 'projected-' + file.name;
      return onCsvLoaded(reader.result);
    };
    reader.onerror = function() {
      return addAlert('There was an error reading the file: ' + reader.error.name);
    };
    return reader.readAsText(file);
  };

  onCsvLoaded = function(csvString) {
    var rows;
    rows = CSV.csvToArray(csvString, true);
    if (rows.length < 2) {
      addAlert('Input CSV must have at least one header row and one data row.');
      return;
    }
    return setInput(rows[0], rows.slice(1));
  };

  onInputColumnChange = function(evt) {
    var coord, target;
    target = $(evt.target);
    coord = target.attr('data-coord');
    if (coord === 'x') {
      _this.coordIndices[0] = target.children('option:selected').val();
    }
    if (coord === 'y') {
      _this.coordIndices[1] = target.children('option:selected').val();
    }
    return refreshInputData();
  };

  onDownload = function(evt) {
    var bb, blob, data, p, r, row, x, y, _i, _len, _ref;
    data = [[].concat(_this.inputHeaders, ['X', 'Y'])];
    _ref = _this.inputData;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      r = _ref[_i];
      x = r[_this.coordIndices[0]];
      y = r[_this.coordIndices[1]];
      if (x !== null && y !== null) {
        p = new Proj4js.Point(x, y, 0);
        Proj4js.transform(_this.inputProj, _this.outputProj, p);
      } else {
        p = new Proj4js.Point(0, 0, 0);
      }
      row = [].concat(r, [p.x, p.y]);
      data = data.concat([row]);
    }
    bb = new BlobBuilder();
    bb.append(CSV.arrayToCsv(data));
    blob = bb.getBlob("text/csv;charset=" + document.characterSet);
    return saveAs(blob, _this.outputFilename);
  };

  setInputProjection = function(srs) {
    _this.inputProj = new Proj4js.Proj(srs);
    if (!_this.inputProj.readyToUse) {
      addAlert('Input projection not in database.');
    }
    return refreshInputData();
  };

  setOutputProjection = function(srs) {
    _this.outputProj = new Proj4js.Proj(srs);
    if (!_this.outputProj.readyToUse) {
      addAlert('Input projection not in database.');
    }
    return refreshInputData();
  };

  setInput = function(headers, rows) {
    var col, heading, idx, opt, _i, _j, _len, _len1, _ref, _ref1;
    _this.inputHeaders = headers;
    _this.inputData = rows;
    $('#input-x').empty();
    $('#input-y').empty();
    idx = 0;
    _ref = _this.inputHeaders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      heading = _ref[_i];
      _ref1 = ['x', 'y'];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        col = _ref1[_j];
        opt = $('<option>');
        opt.attr('value', idx);
        opt.text(heading);
        if (col === 'x' && heading === 'Latitude') {
          opt.attr('selected', 1);
        }
        if (col === 'y' && heading === 'Longitude') {
          opt.attr('selected', 1);
        }
        $('#input-' + col).append(opt);
      }
      idx += 1;
    }
    $('#input-x').change();
    return $('#input-y').change();
  };

  refreshInputData = function() {
    var data, p, r, tr, x, y, _i, _len, _ref;
    data = $('#data');
    data.empty();
    _ref = _this.inputData.slice(0, 11);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      r = _ref[_i];
      tr = $('<tr>');
      x = r[_this.coordIndices[0]];
      y = r[_this.coordIndices[1]];
      tr.append($('<td>').text(x));
      tr.append($('<td>').text(y));
      if (x !== null && y !== null) {
        p = new Proj4js.Point(x, y, 0);
        Proj4js.transform(_this.inputProj, _this.outputProj, p);
      } else {
        p = new Proj4js.Point(0, 0, 0);
      }
      tr.append($('<td>').text(p.x));
      tr.append($('<td>').text(p.y));
      data.append(tr);
    }
    return $('#stats').text('Total data rows loaded: ' + _this.inputData.length.toString() + '.');
  };

  addAlert = function(message_text) {
    var alert, message;
    alert = $('<div class="alert alert-error">\
            <button type="button" class="close" data-dismiss="alert">&times;</button>\
        </div>');
    message = $('<div>');
    message.text(message_text);
    alert.append(message);
    return $('#alerts').append(alert);
  };

}).call(this);
