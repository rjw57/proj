## Globals ##########################################################################################

@inputHeaders = []
@inputData = []
@coordIndices = [0, 0]

@outputFilename = 'projected.csv'

## Main function (run on document load) #############################################################
$ ->
    # Projections defs
    Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
    Proj4js.defs["EPSG:27700"] = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs"

    # Initialise input and output projections
    @inputProj = new Proj4js.Proj('EPSG:4326')
    @outputProj = new Proj4js.Proj('EPSG:4326')

    # Check for HTML5 File API
    if !window.File or !window.FileReader or !window.FileList or !window.Blob
        addAlert(
            'Your browser does not support the HTML5 "File" API and so this web site will not work.')
        return

    # Wire up change event for input field
    $('#csv-input').change onCsvFileInputChange

    $('#input-x').change onInputColumnChange
    $('#input-y').change onInputColumnChange

    $('#input-projection').change () =>
        setInputProjection($('#input-projection').children('option:selected').val())
    $('#output-projection').change () =>
        setOutputProjection($('#output-projection').children('option:selected').val())

    $('#input-projection').change()
    $('#output-projection').change()

    $('#download').click onDownload

## Event handlers ###################################################################################

onCsvFileInputChange = (event) =>
    if !event.target.files.length or event.target.files.length == 0
        addAlert('No file selected')
    file = event.target.files[0]

    # Read the input CSV as text and pass the contents to the onCsvLoaded function
    reader = new FileReader
    reader.onload = () =>
        @outputFilename = 'projected-' + file.name
        onCsvLoaded(reader.result)
    reader.onerror = () => addAlert('There was an error reading the file: ' + reader.error.name)
    reader.readAsText(file)

onCsvLoaded = (csvString) =>
    # Attempt to read string into an array
    rows = CSV.csvToArray(csvString, true)

    if rows.length < 2
        addAlert('Input CSV must have at least one header row and one data row.')
        return
    
    setInput(rows[0], rows[1..])

onInputColumnChange = (evt) =>
    target = $(evt.target)
    coord = target.attr('data-coord')

    if coord == 'x'
        @coordIndices[0] = target.children('option:selected').val()
    if coord == 'y'
        @coordIndices[1] = target.children('option:selected').val()

    refreshInputData()

onDownload = (evt) =>
    data = [ [].concat(@inputHeaders, ['X', 'Y']) ]

    for r in @inputData
        x = r[@coordIndices[0]]
        y = r[@coordIndices[1]]
        if x != null and y != null
            p = new Proj4js.Point(x, y, 0)
            Proj4js.transform(@inputProj, @outputProj, p)
        else
            p = new Proj4js.Point(0, 0, 0)
        row = [].concat(r, [p.x,p.y])
        data = data.concat([row])

    bb = new BlobBuilder()
    bb.append(CSV.arrayToCsv(data))
    blob = bb.getBlob("text/csv;charset=" + document.characterSet)
    saveAs(blob, @outputFilename)

## Model mutators ###################################################################################

setInputProjection = (srs) =>
    @inputProj = new Proj4js.Proj(srs)
    if not @inputProj.readyToUse
        addAlert('Input projection not in database.')
    refreshInputData()

setOutputProjection = (srs) =>
    @outputProj = new Proj4js.Proj(srs)
    if not @outputProj.readyToUse
        addAlert('Input projection not in database.')
    refreshInputData()

setInput = (headers, rows) =>
    @inputHeaders = headers
    @inputData = rows

    $('#input-x').empty()
    $('#input-y').empty()

    idx = 0
    for heading in @inputHeaders
        for col in ['x', 'y']
            opt = $('<option>')
            opt.attr('value', idx)
            opt.text(heading)

            if col == 'y' and heading == 'Latitude'
                opt.attr('selected', 1)
            if col == 'x' and heading == 'Longitude'
                opt.attr('selected', 1)

            $('#input-' + col).append(opt)
        idx += 1

    $('#input-x').change()
    $('#input-y').change()

refreshInputData = () =>
    data = $('#data')
    data.empty()
    for r in @inputData[..10]
        tr = $('<tr>')

        x = r[@coordIndices[0]]
        y = r[@coordIndices[1]]

        tr.append($('<td>').text(x))
        tr.append($('<td>').text(y))

        if x != null and y != null
            p = new Proj4js.Point(x, y, 0)
            Proj4js.transform(@inputProj, @outputProj, p)
        else
            p = new Proj4js.Point(0, 0, 0)
        tr.append($('<td>').text(p.x))
        tr.append($('<td>').text(p.y))

        data.append(tr)

    $('#stats').text('Total data rows loaded: ' + @inputData.length.toString() + '.')

## Utility functions ################################################################################

# Add a dismissable alert to the page
addAlert = (message_text) =>
    alert = $(
        '<div class="alert alert-error">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
        </div>'
    )
    
    message = $('<div>')
    message.text(message_text)
    alert.append(message)

    $('#alerts').append(alert)

# vim:sw=4:sts=4:et
