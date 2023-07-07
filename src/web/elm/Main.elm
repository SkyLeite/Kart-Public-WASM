port module Main exposing (..)

import Browser
import Html exposing (Html, button, canvas, div, li, progress, span, text, ul)
import Html.Attributes exposing (class, height, hidden, id, max, value, width)
import Html.Events exposing (onClick)
import Html.Lazy exposing (lazy)
import Status exposing (Status(..))
import Views.Button


port startGame : () -> Cmd msg


port gameOutput : (String -> msg) -> Sub msg


port statusMessage : (String -> msg) -> Sub msg



-- MAIN


main : Program () Model Msg
main =
    Browser.document { init = init, update = update, view = document, subscriptions = subscriptions }



-- MODEL


type alias Model =
    { outputLines : List String
    , emStatus : Status
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { outputLines = [], emStatus = Status.NotStarted }, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ gameOutput GotGameOutput
        , statusMessage GotStatusMessage
        ]



-- UPDATE


type Msg
    = StartGame
    | GotGameOutput String
    | GotStatusMessage String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        StartGame ->
            ( model, startGame () )

        GotGameOutput line ->
            ( { model | outputLines = model.outputLines ++ [ line ] }, Cmd.none )

        GotStatusMessage line ->
            case Status.parse line of
                Ok Status.Nothing ->
                    ( model, Cmd.none )

                Ok status ->
                    ( { model | emStatus = status }, Cmd.none )

                _ ->
                    ( { model | emStatus = Status.Error }, Cmd.none )



-- VIEW


document : Model -> Browser.Document Msg
document model =
    { body = view model
    , title = "SRB2Kart v1.6"
    }


viewCanvas : Html Msg
viewCanvas =
    lazy (canvas [ id "canvas", width 500, height 500 ]) []


viewConsole : List String -> Html Msg
viewConsole lines =
    div [ class "hidden" ] [ ul [] <| List.map (\line -> li [] [ text line ]) lines ]


viewControls : Status -> Html Msg
viewControls status =
    case status of
        Status.NotStarted ->
            Views.Button.init { text = "Start", onClick = StartGame } |> Views.Button.toHtml

        _ ->
            text ""


viewStatus : Status -> Html Msg
viewStatus status =
    case status of
        NotStarted ->
            text ""

        Running ->
            text ""

        _ ->
            span [ class "text-red-700" ] [ text <| Status.toString status ]


view : Model -> List (Html Msg)
view model =
    [ Html.main_ [ class "w-screen h-screen flex items-center justify-center flex-col" ]
        [ viewCanvas
        , viewConsole model.outputLines
        , viewControls model.emStatus
        , viewStatus model.emStatus
        ]
    ]
